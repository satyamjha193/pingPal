require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const mongoose = require('mongoose');
const flash = require("connect-flash");
const { ensureAuth, validateSession } = require('./middleware/ensureAuth');


// App & Server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);



// MongoDB
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log('✅ MongoDB connected'));

Session
MongoDB
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log('✅ MongoDB connected'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));


// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false
// }));



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


// Socket.IO logic
const { setupSocket } = require('./sockets/chatSockets');
const {RandomchatSockets} =  require("./sockets/randomchatSockets")
// Initialize sockets
setupSocket(io);
RandomchatSockets(io);


// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
