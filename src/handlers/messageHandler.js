const rpMessageHandler = require('../systems/rp/messageHandler');
// const vcMessageHandler = require('../systems/vc/messageHandler'); // ← เพิ่มเมื่อสร้างระบบ VC

// ─── Main Message Router ──────────────────────────────────────────────────────
// เพิ่มระบบใหม่: import handler ด้านบน แล้วเรียกด้านล่าง

module.exports = async function messageHandler(message) {
  if (message.author.bot) return;

  await rpMessageHandler(message);
  // await vcMessageHandler(message);
};
