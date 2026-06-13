const fs   = require('fs');
const path = require('path');

const DATA_DIR    = path.join(__dirname, '../data');
const CONFIG_PATH = path.join(DATA_DIR, 'ticket_config.json');

const DEFAULT_TOPICS = ['🐛 รายงานบัก', '💰 ปัญหาการชำระเงิน', '❓ สอบถามทั่วไป'];

function load() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function guild(guildId) {
  return load()[guildId] || {};
}

function setGlobal(guildId, { adminRoles, logChannel }) {
  const data = load();
  const g = data[guildId] || {};
  if (adminRoles !== undefined) g.adminRoles = adminRoles;
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

// peek = ดูตัวเลขถัดไปโดยไม่บันทึก (ใช้ตั้งชื่อช่องก่อนสร้างจริง)
function peekCounter(guildId) {
  const g = guild(guildId);
  return String((g.counter || 0) + 1).padStart(4, '0');
}

// commit = บันทึกจริง เรียกหลังสร้างช่องสำเร็จเท่านั้น
function commitCounter(guildId) {
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

function resetCounter(guildId) {
  const data = load();
  const g = data[guildId] || {};
  g.counter = 0;
  data[guildId] = g;
  save(data);
}

function setResetTime(guildId, time) {
  const data = load();
  const g = data[guildId] || {};
  g.resetTime = time || null;
  if (!time) delete g.lastResetDate; // clear tracking when disabled
  data[guildId] = g;
  save(data);
}

// เรียกครั้งเดียวตอน bot ready — เช็คทุก 1 นาที reset counter ถ้าถึงเวลา
function startScheduler(client) {
  setInterval(() => {
    try {
      const now   = new Date();
      const hhmm  = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toDateString();

      const data = load();
      let changed = false;

      for (const [guildId, g] of Object.entries(data)) {
        if (!g.resetTime || g.resetTime !== hhmm) continue;
        if (g.lastResetDate === today) continue; // reset ไปแล้ววันนี้

        g.counter       = 0;
        g.lastResetDate = today;
        changed         = true;
        console.log(`[ticket] Counter reset for guild ${guildId} at ${hhmm}`);

        if (g.logChannel && client) {
          client.channels.cache.get(g.logChannel)
            ?.send({ content: `🔄 Ticket counter reset แล้ว (${hhmm})` })
            .catch(() => {});
        }
      }

      if (changed) save(data);
    } catch (err) {
      console.error('[ticket] scheduler error:', err.message);
    }
  }, 60_000);

  console.log('🎫 Ticket counter scheduler started');
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
  peekCounter, commitCounter,
  resetCounter, setResetTime, startScheduler,
  openTicket, getTicket, updateTicket, closeTicket,
  topicSlug,
};
