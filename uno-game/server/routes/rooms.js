const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { rooms } = require('../socket/gameSocket');
const UnoGame  = require('../game/UnoGame');

const router = express.Router();

// POST /api/rooms/create  — เรียกจาก Bot หรือ User ที่ login แล้ว
// ไม่ต้อง auth เพราะห้องเกมไม่มีข้อมูล sensitive — ใครก็สร้างได้
router.post('/create', (req, res) => {
  const roomId   = uuidv4().slice(0, 8).toUpperCase();
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
