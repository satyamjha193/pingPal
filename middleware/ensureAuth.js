// middleware/ensureAuth.js
const User = require('../models/User');

exports.ensureAuth = async function (req, res, next) {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    }

    // attach fresh user object to session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    next();
  } catch (err) {
    console.error('Auth check failed:', err);
    return res.redirect('/login');
  }
};

exports.validateSession = async function (req, res, next) {
  if (req.session.user) {
    const exists = await User.exists({ _id: req.session.user.id });
    if (!exists) {
      req.session.destroy(() => {});
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    }
  }
  next();
};
