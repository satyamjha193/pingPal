const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String, 
    default: "/images/default-avatar.png", // default dp
  },
  bio: {
    type: String,
    default: "Hey there! I am using PingPal 🚀",
    maxlength: 250, // optional safety limit
  },
   blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] // 👈 new
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
