const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'vc_config.json');

// ─── In-memory: active rooms (reset on restart — orphaned channels are cleaned on voiceStateUpdate) ──
// Map<channelId, { ownerId, guildId }>
const activeRooms = new Map();

// ─── Persistent config: guildId → { joinChannelId } ──────────────────────────
let guildConfigs = {};

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    guildConfigs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    console.log('[VC] Config loaded');
  } catch (err) {
    console.error('[VC] Failed to load config:', err.message);
  }
}

function saveConfig() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(guildConfigs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[VC] Failed to save config:', err.message);
  }
}

loadConfig();

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Config
  getJoinChannel(guildId) {
    return guildConfigs[guildId]?.joinChannelId ?? null;
  },
  setJoinChannel(guildId, channelId) {
    guildConfigs[guildId] = { ...(guildConfigs[guildId] ?? {}), joinChannelId: channelId };
    saveConfig();
  },

  // Room registry
  registerRoom(channelId, ownerId, guildId) {
    activeRooms.set(channelId, { ownerId, guildId, panelMessageId: null });
  },
  setPanelMessage(channelId, messageId) {
    const room = activeRooms.get(channelId);
    if (room) room.panelMessageId = messageId;
  },
  unregisterRoom(channelId) {
    activeRooms.delete(channelId);
  },
  getRoom(channelId) {
    return activeRooms.get(channelId) ?? null;
  },
  isManagedChannel(channelId) {
    return activeRooms.has(channelId);
  },
  isOwner(channelId, userId) {
    return activeRooms.get(channelId)?.ownerId === userId;
  },
};
