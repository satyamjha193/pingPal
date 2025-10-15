require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const flash = require("connect-flash");
const { ensureAuth, validateSession } = require('./middleware/ensureAuth');

// App & Server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// ----- MongoDB Connection -----
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // fail fast if DB unreachable
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ----- Express Session -----
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// ----- Middlewares -----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- Routes -----
const homeRoutes = require('./routes/homeRoutes');
const authRoute = require('./routes/authRoutes');
app.use('/', homeRoutes);
app.use('/auth', authRoute);

// ----- Flash middleware -----
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
app.use('/chat', validateSession, ensureAuth);

// ----- Socket.IO -----
const { setupSocket } = require('./sockets/chatSockets');
const { RandomchatSockets, broadcastRoomStatus } = require("./sockets/randomchatSockets");
setupSocket(io);
RandomchatSockets(io);
broadcastRoomStatus(io);

// ----- TEMP: MongoDB test route -----
app.get('/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.send(`✅ MongoDB is connected. Collections: ${collections.map(c => c.name).join(', ')}`);
    } else {
      res.status(500).send('❌ MongoDB is not connected. Current state: ' + mongoose.connection.readyState);
    }
  } catch (err) {
    res.status(500).send('MongoDB connection failed: ' + err.message);
  }
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
