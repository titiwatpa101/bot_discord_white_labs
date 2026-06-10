const rpMessageHandler   = require('../systems/rp/messageHandler');
const afkHandler         = require('../systems/afk/handler');
const clearchatHandler   = require('../systems/clearchat/handler');
const petMessageCommand  = require('../systems/pet/messageCommand');

// ─── Main Message Router ──────────────────────────────────────────────────────

module.exports = async function messageHandler(message) {
  if (message.author.bot) return;

  await clearchatHandler(message);
  await petMessageCommand.handle(message);
  await afkHandler(message);
  await rpMessageHandler(message);
};
