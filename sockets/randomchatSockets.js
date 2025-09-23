// sockets/randomchatSockets.js

// Single source of truth for all rooms
const rooms = {
  1: { messages: [], users: new Map() },
  2: { messages: [], users: new Map() },
  3: { messages: [], users: new Map() }
};

function RandomchatSockets(io) {
  io.on("connection", (socket) => {

    socket.on("joinRoom", ({ room, username }) => {
      if (!rooms[room]) rooms[room] = { messages: [], users: new Map() };
      const users = rooms[room].users;

      const existing = users.get(username);

      // Case 1: Same user reconnecting (refresh within grace period)
      if (existing && existing.disconnectedAt) {
        clearTimeout(existing.timeout); // cancel cleanup
        users.set(username, { socketId: socket.id }); // update socketId
      }
      // Case 2: Username exists in another tab → reject
      else if (existing && !existing.disconnectedAt) {
        socket.emit(
          "usernameTaken",
          "Your session username is already in use in another tab."
        );
        return;
      }
      // Case 3: Brand new user
      else {
        users.set(username, { socketId: socket.id });
      }

      socket.username = username;
      socket.room = room;
      socket.join(room);

      // Cleanup old messages (keep only last 1 hour)
      const cutoff = Date.now() - 3600 * 1000;
      rooms[room].messages = rooms[room].messages.filter(
        (m) => new Date(m.time).getTime() >= cutoff
      );
      rooms[room].messages.forEach((m) => socket.emit("message", m));

      // Send system join/rejoin message
      if (!existing) {
        const joinMsg = {
          username: "System",
          message: `${username} joined the room.`,
          time: new Date()
        };
        rooms[room].messages.push(joinMsg);
        io.to(room).emit("message", joinMsg);
      } else if (existing.disconnectedAt) {
        const rejoinMsg = {
          username: "System",
          message: `${username} rejoined the room.`,
          time: new Date()
        };
        rooms[room].messages.push(rejoinMsg);
        io.to(room).emit("message", rejoinMsg);
      }

      // Show wait message if user is alone
      const connectedUsers = Array.from(users.values()).filter(
        (u) => !u.disconnectedAt
      ).length;
      if (connectedUsers === 1) {
        const waitMsg = {
          username: "System",
          message:
            "You're the only one here. Please wait, another user will connect soon!",
          time: new Date()
        };
        rooms[room].messages.push(waitMsg);
        socket.emit("message", waitMsg);
      }

      // Emit online users count
      io.to(room).emit("usersOnline", connectedUsers);

      // ✅ Emit updated room status to everyone
      broadcastRoomStatus(io);
    });

    // Handle chat messages
    socket.on("message", (data) => {
      if (!socket.room || !socket.username) return;
      const msg = { ...data, time: new Date() };
      rooms[socket.room].messages.push(msg);
      io.to(socket.room).emit("message", msg);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const { room, username } = socket;
      if (!room || !username) return;
      const users = rooms[room].users;
      if (!users.has(username)) return;

      const userData = users.get(username);

      // Only mark as disconnected if socketId matches
      if (userData.socketId !== socket.id) return;

      // 10s grace period before removing user
      userData.disconnectedAt = Date.now();
      userData.timeout = setTimeout(() => {
        users.delete(username);

        const leaveMsg = {
          username: "System",
          message: `${username} left the room.`,
          time: new Date()
        };
        rooms[room].messages.push(leaveMsg);
        io.to(room).emit("message", leaveMsg);

        const currentUsers = Array.from(users.values()).filter(
          (u) => !u.disconnectedAt
        ).length;
        io.to(room).emit("usersOnline", currentUsers);

        // ✅ Update everyone after user leaves
        broadcastRoomStatus(io);
      }, 10000);
    });
  });
}

// Helper: broadcast current room occupancy to all clients
function broadcastRoomStatus(io) {
  const roomStatus = {};
  for (const [roomId, room] of Object.entries(rooms)) {
   const connectedUsers = Array.from(room.users.values())
  .filter(u => !u.disconnectedAt || (Date.now() - u.disconnectedAt) < 10000).length;

    roomStatus[roomId] = connectedUsers;
  }
  io.emit("roomStatus", roomStatus);
}

module.exports = { RandomchatSockets, broadcastRoomStatus };
