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
    subject: 'Your pingPal registration OTP Code',
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

