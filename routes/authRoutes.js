 const User = require("../models/User");
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require("../middleware/upload_dp_multer");
const {ensureAuth} = require('../middleware/ensureAuth');
// Register
router.post('/register', authController.register);

// Verify OTP
router.post('/verify-otp', authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);



// Login
router.post('/login', authController.login);

// Logout
router.get('/logout', authController.logout);


// authRoutes.js
router.get("/get-user/:id", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username email bio avatar joined connections score isOnline");
    if (!user) return res.json({ success: false });

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});



module.exports = router;

