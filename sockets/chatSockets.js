const Message = require("../models/messageModel");
const mongoose = require("mongoose");

const onlineUsers = new Map(); // userId => socket.id

function setupSocket(io) {
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId?.toString();
    if (!userId) return;

    // Add user to online map
    onlineUsers.set(userId, socket.id);
    

    // Notify all clients that this user is online
    io.emit("updateOnlineStatus", { userId, isOnline: true });

    // Join rooms
    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
    });

    // Chat message
    socket.on("chat message", async ({ chatId, msg, senderId }) => {
      try {
        const newMessage = await Message.create({
          chatId: new mongoose.Types.ObjectId(chatId),
          sender: new mongoose.Types.ObjectId(senderId),
          text: msg,
        });

        io.to(chatId).emit("chat message", {
          _id: newMessage._id,
          chatId,
          msg: newMessage.text,
          sender: newMessage.sender.toString(),
          createdAt: newMessage.createdAt,
        });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing");
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("updateOnlineStatus", { userId, isOnline: false });
    });
  });
}

// Helper to check if a user is online
function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

module.exports = {
  setupSocket,
  isUserOnline
};

