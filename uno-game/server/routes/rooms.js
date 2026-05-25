const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { rooms } = require('../socket/gameSocket');
const UnoGame  = require('../game/UnoGame');

const router = express.Router();

// ─── Auth middleware: Bot API key หรือ User ที่ login แล้ว ─────────────────────
function createAuth(req, res, next) {
  const botKey   = req.headers['x-bot-key'];
  const isBot    = process.env.BOT_API_KEY && botKey === process.env.BOT_API_KEY;
  const isUser   = !!req.user;
  if (!isBot && !isUser) {
    return res.status(401).json({ error: 'ต้อง login ก่อนสร้างห้อง' });
  }
  next();
}

// POST /api/rooms/create  — เรียกจาก Discord Bot หรือ User ที่ login แล้ว
router.post('/create', createAuth, (req, res) => {
  const roomId   = uuidv4().slice(0, 8).toUpperCase(); // เช่น "A3F9B2C1"
  rooms.set(roomId, new UnoGame(roomId));

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  console.log(`[Rooms] ห้องใหม่: ${roomId}`);
  res.json({ roomId, url: `${clientUrl}/room/${roomId}` });
});

// GET /api/rooms/:id  — ตรวจสอบห้องก่อนเข้า
router.get('/:id', (req, res) => {
  const game = rooms.get(req.params.id.toUpperCase());
  if (!game) return res.status(404).json({ error: 'ไม่พบห้องนี้' });
  res.json({
    id:          game.id,
    state:       game.state,
    playerCount: game.players.length,
    maxPlayers:  4,
  });
});

module.exports = router;
