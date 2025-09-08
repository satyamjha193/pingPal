const User = require("../models/User")
const generateOTP  = require("../utils/otpGenerator");
const { sendOtpEmail } = require("../utils/mailer");


// Register & send OTP
exports.register = async (req, res) => {
  try {

    const { email, username, password } = req.body;
    console.log('📥 Incoming data:', { email, username });

    // Check for duplicate email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
     console.log('🔍 Existing user found:', existingUser);

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const otp = generateOTP();

    const user = new User({
      email,
      username,
      password,
      otp: {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60000), // 10 mins
      }
    });

    await user.save();

    // ✅ Send OTP via Email
    await sendOtpEmail(email, otp);
    console.log('📧 OTP email sent');

    res.status(200).json({ message: 'OTP sent to your email', userId: user._id });

  } catch (err) {
    console.error('❌ Registration error:', err);
    console.error(err.stack); // full error stack
    res.status(500).json({ error: 'Server error' });
  }
};

// OTP Verification
exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user || user.otp.code !== otp || user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    req.session.user = { id: user._id, username: user.username, email: user.email };

    req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Session error");
      }
        console.log("✅ Session after OTP verify:", req.session);
      res.redirect('/chat');
    });

  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};




// ⏳ Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const otp = generateOTP();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60000), // 10 mins
    };

    await user.save();

    // ✅ Send OTP again
    await sendOtpEmail(user.email, otp);
    console.log("📧 OTP resent to:", user.email);

    res.status(200).json({ message: "OTP resent successfully" });

  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   host: "smtp.gmail.com",
  port: 465, // 465 for SSL
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"PingPal App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent');
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err);
    throw new Error('Email sending failed');
  }
};


transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP connection error:', error);
  } else {
    console.log('✅ SMTP server is ready to take messages');
  }
});




























// Login controller
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error_msg", "User does not exist");
      return res.redirect("/login");
    }

    // Check verification
    if (!user.isVerified) {
      req.flash("error_msg", "Account not verified. Please verify your email.");
      return res.redirect("/login");
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    // ✅ Save minimal data into session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    req.flash("success_msg", "Login successful!");
    return res.redirect("/chat");

  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    return res.redirect("/login");
  }
};

// Logout Controller
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed. Please try again.");
    }
    res.clearCookie("connect.sid"); // clear session cookie
    return res.redirect("/");  // redirect user
  });
};




// Update Profile

exports.editProfile = async (req, res) => {
  try {
    // 1. Ensure session user exists
    if (!req.session || !req.session.user || !(req.session.user.id || req.session.user._id)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.session.user.id || req.session.user._id; // support both just in case
    const { username, bio } = req.body;
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    // 2. Build update object
    const update = {};
    if (username) update.username = username;
    if (typeof bio !== "undefined") update.bio = bio;
    if (avatarPath) update.avatar = avatarPath;

    // 3. Update DB
    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    // 4. Merge updated fields into session.user (preserve other session properties)
    req.session.user = {
      ...req.session.user, // keep any other keys
      id: updatedUser._id.toString(), // always keep id as string
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar || req.session.user.avatar || null,
      bio: updatedUser.bio || req.session.user.bio || null
    };

    // 5. Persist session before redirecting
    req.session.save(err => {
      if (err) {
        console.error("Session save error after profile edit:", err);
        // still try to redirect but log error
      }
      return res.redirect("/chat");
    });

  } catch (err) {
    console.error("Edit profile error:", err);
    res.status(500).send("Something went wrong");
  }
};
