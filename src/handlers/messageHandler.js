const rpMessageHandler   = require('../systems/rp/messageHandler');
const afkHandler         = require('../systems/afk/handler');
const clearchatHandler   = require('../systems/clearchat/handler');

// ─── Main Message Router ──────────────────────────────────────────────────────

module.exports = async function messageHandler(message) {
  if (message.author.bot) return;

  await clearchatHandler(message);
  await afkHandler(message);
  await rpMessageHandler(message);
};
