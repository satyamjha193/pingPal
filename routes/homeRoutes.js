const express = require('express');
const router = express.Router();

const Chat = require('../models/chatModel');       // your conversation model
const Message = require('../models/messageModel');
const {ensureAuth} = require('../middleware/ensureAuth');
const User = require('../models/User');
// Routes for EJS views

router.get('/', (req, res) => res.render('index'));
router.get('/login', (req, res) => {
  res.render('login-register', { 
    error_msg: req.flash('error_msg') || null
  });
});

router.get('/features', (req, res) => res.render('feature'));





// GET /chat - default page
router.get('/chat', ensureAuth, async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id || req.session.user?.id;
    if (!sessionUserId) return res.redirect('/login');

    const currentUser = await User.findById(sessionUserId).lean();
    if (!currentUser) return res.redirect('/login');

    // Only allow verified users
    if (!currentUser.isVerified) {
      return res.redirect('/verify-otp'); // new route to enter OTP
    }

    const users = await User.find({ _id: { $ne: sessionUserId } }, 'username email avatar bio');

    res.render('chat', {
      user: currentUser,
      users,
      activeChat: null,
      chat: null,
      messages: [],
      currentUserId: currentUser._id.toString()
    });
  } catch (err) {
    console.error('❌ Error in /chat route:', err);
    res.status(500).send('Server error');
  }
});

















// GET /chat/:chatId - open selected chat
// =======================

const {setupSocket, isUserOnline, } = require("../sockets/chatSockets");
const mongoose = require("mongoose");

router.get('/chat/messages/:userId', ensureAuth, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.session.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json({ chat: null, messages: [] });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] }
    }).populate('participants', 'username');

    if (!chat) {
      chat = await Chat.create({ participants: [currentUserId, userId] });
    }

    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });

    const otherUser = chat.participants.find(
      p => p._id.toString() !== currentUserId.toString()
    );

    res.json({
      chat: {
        _id: chat._id,
        username: otherUser.username,
        isOnline: isUserOnline(otherUser._id.toString())
      },
      messages
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ chat: null, messages: [] });
  }
});





const authController = require('../controllers/authController');
const upload = require("../middleware/upload_dp_multer");
// Edit Profile (POST request with form-data)
router.post("/edit-profile",ensureAuth ,upload.single("avatar"), authController.editProfile);



// DELETE all messages in a chat
router.delete('/chat/:chatId/all-messages', ensureAuth, async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: 'Invalid chat ID' });
  }

  try {
    const chat = await Chat.findById(chatId);
    console.log('chat.participants:', chat.participants);
    console.log('req.session.user:', req.session.user);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const participantIds = chat.participants.map(p => p.toString());
    const currentUserId = req.session.user._id || req.session.user.id;

    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.deleteMany({ chatId: chatId });

    return res.status(200).json({ message: 'All messages deleted' });
  } catch (err) {
    console.error('Delete messages error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});




const roomsInfo = {
  1: new Set(),
  2: new Set(),
  3: new Set()
};

function generateUsername() {
  const adjectives = ["Cool", "Smart", "Quick", "Bright", "Happy", "Chill", "Funny","Brave","Hot"];
  const nouns = ["Tiger", "Panda", "Eagle", "Fox", "Lion", "Shark", "Wolf","Human","Alien"];
  const num = Math.floor(Math.random() * 1000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${num}`;
}

function getSessionUsername(req) {
  if (!req.session.username) req.session.username = generateUsername();
  return req.session.username;
}

// Landing page
router.get('/random-chatRoom', (req, res) => {
  if (!req.session.user) {
    req.session.user = { username: generateUsername(), room: null };
  }
  res.render('randomChatroom', { rooms: roomsInfo, username: req.session.user.username });
});

// Room route
router.get(['/room/:id', '/room'], (req, res) => {
  if (!req.session.user) {
    // session expired → redirect to landing
    return res.redirect('/random-chatRoom');
  }

  let roomNumber = parseInt(req.params.id, 10) || req.session.user.room;

  if (![1, 2, 3].includes(roomNumber)) {
    return res.redirect('/random-chatRoom');
  }

  req.session.user.room = roomNumber;  // store chosen room

  // Track users for stats
  roomsInfo[roomNumber].add(req.session.user.username);

  res.render('chatRoom', {
    room: roomNumber,
    username: req.session.user.username
  });
});


module.exports = router;


