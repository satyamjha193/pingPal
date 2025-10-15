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




//MongoDB
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log('✅ MongoDB connected'));

// Session
// ----- MongoDB Connection -----
mongoose.connect(process.env.MONGO_URI, {
  ssl: true,
  tlsCAFile: undefined, // optional if needed
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000, // short timeout to fail fast
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));


app.use(session({
    secret: process.env.SESSION_SECRET,  // keep this secure!
    resave: false,                        // don't save if unmodified
    saveUninitialized: false,             // don't save empty sessions
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // MongoDB connection for sessions
        collectionName: 'sessions',      // optional: defaults to 'sessions'
        ttl: 24 * 60 * 60                // session expiration in seconds (1 day)
    }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,     // 1 day in milliseconds
        httpOnly: true,                  // can't access cookie via client-side JS
        secure: process.env.NODE_ENV === 'production', // only HTTPS in prod
        sameSite: 'lax'                  // protects against CSRF
    }
}));







// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Routes
const homeRoutes = require('./routes/homeRoutes');
const authRoute = require('./routes/authRoutes');

app.use('/', homeRoutes);
app.use('/auth', authRoute);



// Middleware to pass flash messages to all views
// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
app.use('/chat', validateSession, ensureAuth);


// Socket.IO logic     -----Initialize sockets
const { setupSocket } = require('./sockets/chatSockets');
const {RandomchatSockets,broadcastRoomStatus} =  require("./sockets/randomchatSockets")

setupSocket(io);
RandomchatSockets(io);
broadcastRoomStatus(io);

// ------------------- Your existing code -------------------
// ... all your middlewares, routes, and Socket.IO setup

// TEMP: Safe MongoDB connection test
app.get('/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) { // 1 = connected
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.send(`✅ MongoDB is connected. Collections: ${collections.map(c => c.name).join(', ')}`);
    } else {
      res.status(500).send('❌ MongoDB is not connected. Current state: ' + mongoose.connection.readyState);
    }
  } catch (err) {
    res.status(500).send('MongoDB connection failed: ' + err.message);
  }
});


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
