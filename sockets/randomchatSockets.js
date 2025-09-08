const rooms = {
  1: { messages: [], users: new Map() },
  2: { messages: [], users: new Map() },
  3: { messages: [], users: new Map() }
};

function RandomchatSockets(io) {
  io.on('connection', socket => {

    socket.on('joinRoom', ({ room, username }) => {
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
        socket.emit('usernameTaken', "Your session username is already in use in another tab.");
        return;
      }
      // Case 3: New user
      else {
        users.set(username, { socketId: socket.id });
      }

      socket.username = username;
      socket.room = room;
      socket.join(room);

      // ==========================
      // Send last 1h messages
      // ==========================
      const cutoff = Date.now() - 3600 * 1000;
      rooms[room].messages = rooms[room].messages.filter(m => new Date(m.time).getTime() >= cutoff);
      rooms[room].messages.forEach(m => socket.emit('message', m));

      // ==========================
      // Broadcast join if new or reconnect
      // ==========================
      if (!existing) {
    // Brand new user
          const joinMsg = { username: 'System', message: `${username} joined the room.`, time: new Date() };
          rooms[room].messages.push(joinMsg);
          io.to(room).emit('message', joinMsg);
      } else if (existing.disconnectedAt) {
          // User reconnected / refreshed
          const rejoinMsg = { username: 'System', message: `${username} rejoined the room.`, time: new Date() };
          rooms[room].messages.push(rejoinMsg);
          io.to(room).emit('message', rejoinMsg);
      }


      // ==========================
      // Show "only one here" message if alone
      // ==========================
      const connectedUsers = Array.from(users.values()).filter(u => !u.disconnectedAt).length;
      if (connectedUsers === 1) {
        const waitMsg = {
          username: 'System',
          message: "You're the only one here. Please wait, another user will connect soon!",
          time: new Date()
        };
        rooms[room].messages.push(waitMsg);
        socket.emit('message', waitMsg);
      }

      // ==========================
      // Emit online users count
      // ==========================
      io.to(room).emit('usersOnline', connectedUsers);

      // ==========================
      // Handle chat messages
      // ==========================
      socket.on('message', data => {
        const msg = { ...data, time: new Date() };
        rooms[room].messages.push(msg);
        io.to(room).emit('message', msg);
      });

      // ==========================
      // Handle disconnect
      // ==========================
      socket.on('disconnect', () => {
        if (!users.has(username)) return;
        const userData = users.get(username);

        // Only mark as disconnected if socketId matches
        if (userData.socketId !== socket.id) return;

        // 30s grace period before removing user
        userData.disconnectedAt = Date.now();
        userData.timeout = setTimeout(() => {
          users.delete(username);

          const leaveMsg = { username: 'System', message: `${username} left the room.`, time: new Date() };
          rooms[room].messages.push(leaveMsg);
          io.to(room).emit('message', leaveMsg);

          const currentUsers = Array.from(users.values()).filter(u => !u.disconnectedAt).length;
          io.to(room).emit('usersOnline', currentUsers);
        }, 30000);
      });

    }); // end joinRoom
  }); // end connection
}

module.exports = { RandomchatSockets };
