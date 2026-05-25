const UnoGame = require('../game/UnoGame');

// rooms map is exported so routes/rooms.js can pre-create rooms
const rooms = new Map(); // roomId → UnoGame

function initSocket(io) {
  io.on('connection', (socket) => {
    const user = socket.request.session?.passport?.user;
    if (!user) {
      socket.emit('auth_error', { message: 'ยังไม่ได้ล็อกอิน' });
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket] connect  → ${user.username}`);

    // ── join_room ────────────────────────────────────────────────────────────
    socket.on('join_room', ({ roomId }) => {
      const id = (roomId || '').toUpperCase();

      if (!rooms.has(id)) rooms.set(id, new UnoGame(id));
      const game = rooms.get(id);

      const result = game.addPlayer(socket.id, user.id, user.username, user.avatar);
      if (result.error) return socket.emit('error', { message: result.error });

      socket.join(id);
      socket.data.roomId = id;

      broadcastState(io, game);
      io.to(id).emit('player_joined', {
        userId:      user.id,
        displayName: user.username,
      });
    });

    // ── start_game ───────────────────────────────────────────────────────────
    socket.on('start_game', () => {
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      if (game.players[0]?.socketId !== socket.id)
        return socket.emit('error', { message: 'เฉพาะ Host เท่านั้นที่เริ่มเกมได้' });

      const result = game.start();
      if (result.error) return socket.emit('error', { message: result.error });

      // Send each player their private state (with hand)
      for (const p of game.players) {
        io.to(p.socketId).emit('game_started', game.getStateFor(p.socketId));
      }
    });

    // ── play_card ────────────────────────────────────────────────────────────
    socket.on('play_card', ({ cardId, chosenColor }) => {
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      const result = game.playCard(socket.id, cardId, chosenColor || null);
      if (result.error) return socket.emit('error', { message: result.error });

      if (result.won) {
        for (const p of game.players) {
          io.to(p.socketId).emit('game_over', game.getStateFor(p.socketId));
        }
        return;
      }

      broadcastState(io, game);
    });

    // ── draw_card ────────────────────────────────────────────────────────────
    socket.on('draw_card', () => {
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      const result = game.drawCard(socket.id);
      if (result.error) return socket.emit('error', { message: result.error });

      broadcastState(io, game);
    });

    // ── say_uno ──────────────────────────────────────────────────────────────
    socket.on('say_uno', () => {
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      const result = game.sayUno(socket.id);
      if (result.error) return socket.emit('error', { message: result.error });

      io.to(socket.data.roomId).emit('uno_said', {
        userId:      user.id,
        displayName: user.username,
      });
      broadcastState(io, game);
    });

    // ── catch_uno ────────────────────────────────────────────────────────────
    socket.on('catch_uno', ({ targetUserId }) => {
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      const result = game.catchUno(socket.id, targetUserId);
      if (result.error) return socket.emit('error', { message: result.error });

      io.to(socket.data.roomId).emit('uno_caught', {
        catcher:    user.username,
        target:     result.targetDisplayName,
      });
      broadcastState(io, game);
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] disconnect → ${user.username}`);
      const game = rooms.get(socket.data.roomId);
      if (!game) return;

      game.removePlayer(socket.id);

      if (game.players.length === 0) {
        rooms.delete(socket.data.roomId);
      } else {
        broadcastState(io, game);
        io.to(socket.data.roomId).emit('player_left', {
          userId:      user.id,
          displayName: user.username,
        });
      }
    });
  });
}

// ─── Helper: broadcast state to every player in the room ─────────────────────
function broadcastState(io, game) {
  for (const p of game.players) {
    io.to(p.socketId).emit('game_state', game.getStateFor(p.socketId));
  }
}

module.exports = { initSocket, rooms };
