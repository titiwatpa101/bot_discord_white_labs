const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'vc_config.json');

// ─── In-memory: active rooms (reset on restart — orphaned channels cleaned on voiceStateUpdate) ──
// Map<channelId, { ownerId, guildId, panelMessageId }>
const activeRooms = new Map();

// ─── Persistent config: guildId → { joinChannelIds: string[] } ───────────────
let guildConfigs = {};

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    for (const [guildId, cfg] of Object.entries(raw)) {
      // Migrate old format: { joinChannelId: "xxx" } → { joinChannelIds: ["xxx"] }
      if (cfg.joinChannelId && !cfg.joinChannelIds) {
        guildConfigs[guildId] = { joinChannelIds: [cfg.joinChannelId] };
      } else {
        guildConfigs[guildId] = cfg;
      }
    }
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

// ─── Env var bootstrap — Railway persistence across redeploys ─────────────────
// ตั้งค่า VC_JOIN_CHANNEL_IDS=id1,id2,id3 ใน Railway เพื่อให้ config คงอยู่
function getEnvIds() {
  const raw = process.env.VC_JOIN_CHANNEL_IDS || process.env.VC_JOIN_CHANNEL_ID || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

loadConfig();

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // ── ตรวจว่า channel นี้เป็นห้อง "สร้างห้อง" หรือเปล่า ──
  isJoinChannel(guildId, channelId) {
    const stored = guildConfigs[guildId]?.joinChannelIds ?? [];
    return stored.includes(channelId) || getEnvIds().includes(channelId);
  },

  // ── ดึง channel IDs ทั้งหมด (file + env var) ──
  getJoinChannels(guildId) {
    const stored = guildConfigs[guildId]?.joinChannelIds ?? [];
    return [...new Set([...stored, ...getEnvIds()])];
  },

  // ── เพิ่มห้อง "สร้างห้อง" ──
  addJoinChannel(guildId, channelId) {
    const current = guildConfigs[guildId]?.joinChannelIds ?? [];
    if (!current.includes(channelId)) {
      guildConfigs[guildId] = {
        ...(guildConfigs[guildId] ?? {}),
        joinChannelIds: [...current, channelId],
      };
      saveConfig();
    }
  },

  // ── ลบห้อง "สร้างห้อง" ──
  removeJoinChannel(guildId, channelId) {
    const current = guildConfigs[guildId]?.joinChannelIds ?? [];
    guildConfigs[guildId] = {
      ...(guildConfigs[guildId] ?? {}),
      joinChannelIds: current.filter((id) => id !== channelId),
    };
    saveConfig();
  },

  // ── Room registry ──
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
