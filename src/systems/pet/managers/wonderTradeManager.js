const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/wondertrade.json');

function load() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}

function save(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }

function getGuild(guildId) {
  const data = load();
  if (!data[guildId]) {
    data[guildId] = { panelChannelId: null, panelMessageId: null, pool: [] };
    save(data);
  }
  return data[guildId];
}

function saveGuild(guildId, g) {
  const data = load();
  data[guildId] = g;
  save(data);
}

// entry: { userId, username, instanceId, speciesId, name, rarity, emoji, level }
function addToPool(guildId, entry) {
  const g = getGuild(guildId);
  // Each user can only have 1 entry — replace if exists
  g.pool  = g.pool.filter(e => e.userId !== entry.userId);
  g.pool.push({ ...entry, addedAt: Date.now() });
  saveGuild(guildId, g);
}

function removeFromPool(guildId, userId) {
  const g   = getGuild(guildId);
  const idx = g.pool.findIndex(e => e.userId === userId);
  if (idx === -1) return null;
  const [entry] = g.pool.splice(idx, 1);
  saveGuild(guildId, g);
  return entry;
}

function getPool(guildId) { return getGuild(guildId).pool; }

function inPool(guildId, userId) {
  return getGuild(guildId).pool.some(e => e.userId === userId);
}

// Match user with a random entry from others — removes matched entry from pool
function matchTrade(guildId, userId) {
  const g          = getGuild(guildId);
  const candidates = g.pool.filter(e => e.userId !== userId);
  if (!candidates.length) return null;
  const match  = candidates[Math.floor(Math.random() * candidates.length)];
  g.pool       = g.pool.filter(e => e.userId !== match.userId);
  saveGuild(guildId, g);
  return match;
}

function setPanelConfig(guildId, channelId, messageId) {
  const g = getGuild(guildId);
  g.panelChannelId = channelId;
  g.panelMessageId = messageId;
  saveGuild(guildId, g);
}

function getPanelConfig(guildId) {
  const g = getGuild(guildId);
  return { channelId: g.panelChannelId, messageId: g.panelMessageId };
}

module.exports = { addToPool, removeFromPool, getPool, inPool, matchTrade, setPanelConfig, getPanelConfig };
