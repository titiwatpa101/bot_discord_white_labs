const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '../data');
const DATA_PATH = path.join(DATA_DIR, 'calendar_data.json');

function load() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function guild(guildId) {
  return load()[guildId] || {};
}

function setAllowedRoles(guildId, roleIds) {
  const data = load();
  const g = data[guildId] || {};
  g.allowedRoles = roleIds; // [] = ทุกคน
  data[guildId] = g;
  save(data);
}

function getAllowedRoles(guildId) {
  return guild(guildId).allowedRoles || [];
}

function setPanel(guildId, channelId, messageId) {
  const data = load();
  const g = data[guildId] || {};
  g.panel = { channelId, messageId };
  data[guildId] = g;
  save(data);
}

function getPanel(guildId) {
  return guild(guildId).panel || null;
}

function removePanel(guildId) {
  const data = load();
  const g = data[guildId];
  if (!g) return;
  delete g.panel;
  save(data);
}

// booking = { topic, whoType:'role'|'user'|'none', whoId, whoName, createdBy }
function addBooking(guildId, dateStr, booking) {
  const data = load();
  const g = data[guildId] || {};
  if (!g.bookings) g.bookings = {};
  if (!g.bookings[dateStr]) g.bookings[dateStr] = [];
  g.bookings[dateStr].push(booking);
  data[guildId] = g;
  save(data);
}

function removeBooking(guildId, dateStr, index) {
  const data = load();
  const g = data[guildId];
  if (!g?.bookings?.[dateStr]) return false;
  g.bookings[dateStr].splice(index, 1);
  if (!g.bookings[dateStr].length) delete g.bookings[dateStr];
  save(data);
  return true;
}

// returns { "YYYY-MM-DD": [booking, ...] } for the given month
function getMonthBookings(guildId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const bookings = guild(guildId).bookings || {};
  const result = {};
  for (const [date, list] of Object.entries(bookings)) {
    if (date.startsWith(prefix)) result[date] = list;
  }
  return result;
}

function setNotifyConfig(guildId, channelId, time) {
  const data = load();
  const g = data[guildId] || {};
  g.notifyConfig = { channelId, time };
  data[guildId] = g;
  save(data);
}

function getNotifyConfig(guildId) {
  return guild(guildId).notifyConfig || null;
}

function removeAllBookingsForDate(guildId, dateStr) {
  const data = load();
  const g = data[guildId];
  if (!g?.bookings?.[dateStr]) return;
  delete g.bookings[dateStr];
  save(data);
}

function getAllGuildIds() {
  return Object.keys(load());
}

module.exports = {
  setAllowedRoles, getAllowedRoles,
  setPanel, getPanel, removePanel,
  addBooking, removeBooking, getMonthBookings,
  setNotifyConfig, getNotifyConfig,
  removeAllBookingsForDate, getAllGuildIds,
};
