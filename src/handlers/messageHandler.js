const rpMessageHandler  = require('../systems/rp/messageHandler');
const afkHandler        = require('../systems/afk/handler');

// ─── Main Message Router ──────────────────────────────────────────────────────

module.exports = async function messageHandler(message) {
  if (message.author.bot) return;

  await afkHandler(message);
  await rpMessageHandler(message);
};
