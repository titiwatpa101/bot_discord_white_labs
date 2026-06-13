const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/ticket_config.json');

const DEFAULT_TOPICS = ['🐛 รายงานบัก', '💰 ปัญหาการชำระเงิน', '❓ สอบถามทั่วไป'];

function load() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function guild(guildId) {
  return load()[guildId] || {};
}

function setGlobal(guildId, { adminRole, logChannel }) {
  const data = load();
  const g = data[guildId] || {};
  if (adminRole  !== undefined) g.adminRole  = adminRole;
  if (logChannel !== undefined) g.logChannel = logChannel;
  data[guildId] = g;
  save(data);
}

function addPanel(guildId, channelId, roles, topics, category, messageId) {
  const data = load();
  const g = data[guildId] || {};
  if (!g.panels) g.panels = {};
  g.panels[channelId] = { roles, topics, category: category || null, messageId };
  data[guildId] = g;
  save(data);
}

function removePanel(guildId, channelId) {
  const data = load();
  const g = data[guildId];
  if (!g?.panels) return;
  delete g.panels[channelId];
  save(data);
}

function getPanel(guildId, channelId) {
  return guild(guildId).panels?.[channelId] || null;
}

function nextCounter(guildId) {
  const data = load();
  const g = data[guildId] || {};
  g.counter = (g.counter || 0) + 1;
  data[guildId] = g;
  save(data);
  return String(g.counter).padStart(4, '0');
}

function openTicket(guildId, ticketChannelId, info) {
  const data = load();
  const g = data[guildId] || {};
  if (!g.tickets) g.tickets = {};
  g.tickets[ticketChannelId] = info;
  data[guildId] = g;
  save(data);
}

function getTicket(guildId, ticketChannelId) {
  return guild(guildId).tickets?.[ticketChannelId] || null;
}

function updateTicket(guildId, ticketChannelId, patch) {
  const data = load();
  const g = data[guildId];
  if (!g?.tickets?.[ticketChannelId]) return;
  Object.assign(g.tickets[ticketChannelId], patch);
  save(data);
}

function closeTicket(guildId, ticketChannelId) {
  const data = load();
  const g = data[guildId];
  if (!g?.tickets) return;
  delete g.tickets[ticketChannelId];
  save(data);
}

// Generate Discord-safe slug from topic text (strips emoji + Thai chars)
function topicSlug(topicText, index) {
  const noEmoji = topicText.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
  const ascii = noEmoji
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 20);
  return ascii || `t${index + 1}`;
}

module.exports = {
  DEFAULT_TOPICS,
  load, save, guild,
  setGlobal, addPanel, removePanel, getPanel,
  nextCounter, openTicket, getTicket, updateTicket, closeTicket,
  topicSlug,
};
