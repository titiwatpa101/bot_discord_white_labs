const petManager       = require('./managers/petManager');
const marketManager    = require('./managers/marketManager');
const wtManager        = require('./managers/wonderTradeManager');
const mainPanel        = require('./panels/mainPanel');
const marketPanel      = require('./panels/marketPanel');
const wonderTradePanel = require('./panels/wonderTradePanel');
const gachaPanel       = require('./panels/gachaPanel');

const PANEL_TTL = 5 * 60_000; // auto-delete after 5 minutes

async function handle(message) {
  const content = message.content.trim().toLowerCase();
  if (!content.startsWith('!pet') && content !== '!market' && content !== '!trade' && content !== '!gcpet') return;

  const guildId = message.guildId;
  const userId  = message.author.id;

  let page = 'main';
  if (content === '!market')  page = 'market';
  if (content === '!trade')   page = 'trade';
  if (content === '!gcpet')   page = 'gacha';

  // Delete user's command message
  message.delete().catch(() => {});

  const user = petManager.getUser(guildId, userId);

  let panel;
  if (page === 'market') {
    panel = marketPanel.build(userId, guildId, user);
  } else if (page === 'trade') {
    panel = wonderTradePanel.build(userId, guildId, user);
  } else if (page === 'gacha') {
    panel = gachaPanel.build(userId, user);
  } else {
    panel = mainPanel.build(userId, user);
  }

  panel.content = `<@${userId}>`;

  let sent;
  try { sent = await message.channel.send(panel); }
  catch { return; }

  // Auto-delete panel after TTL
  setTimeout(() => { sent.delete().catch(() => {}); }, PANEL_TTL);
}

module.exports = { handle };
