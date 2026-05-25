const fs   = require('fs');
const path = require('path');

const DATA_FILE      = path.join(__dirname, '../../../data/newbie-queue.json');
const NEWBIE_DURATION = parseInt(process.env.NEWBIE_DURATION_MS) || 24 * 60 * 60 * 1000; // 24h

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadQueue() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(queue, null, 2));
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

function addEntry(userId, guildId) {
  const queue    = loadQueue();
  const filtered = queue.filter((e) => !(e.userId === userId && e.guildId === guildId));
  filtered.push({ userId, guildId, removeAt: Date.now() + NEWBIE_DURATION });
  saveQueue(filtered);
}

function removeEntry(userId, guildId) {
  const queue = loadQueue();
  saveQueue(queue.filter((e) => !(e.userId === userId && e.guildId === guildId)));
}

module.exports = { loadQueue, addEntry, removeEntry, NEWBIE_DURATION };
