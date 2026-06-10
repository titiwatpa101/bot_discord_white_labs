const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/spawn_config.json');
const catalog   = require('../data/catalog.json');

const activeSpawns = new Map(); // key: `${guildId}_${channelId}`
const spawnTimers  = new Map(); // key: guildId

function load() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}

function save(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }

function getGuild(guildId) {
  const data = load();
  if (!data[guildId]) {
    data[guildId] = { channels: [], intervalMinutes: 30 };
    save(data);
  }
  return data[guildId];
}

function setupChannel(guildId, channelId, intervalMinutes) {
  const data = load();
  if (!data[guildId]) data[guildId] = { channels: [], intervalMinutes: 30 };
  if (!data[guildId].channels.includes(channelId)) data[guildId].channels.push(channelId);
  if (intervalMinutes) data[guildId].intervalMinutes = intervalMinutes;
  save(data);
}

function removeChannel(guildId, channelId) {
  const data = load();
  if (!data[guildId]) return;
  data[guildId].channels = data[guildId].channels.filter(c => c !== channelId);
  save(data);
}

function getConfig(guildId) { return getGuild(guildId); }

// Weighted random species pick
function pickSpecies() {
  const entries     = Object.entries(catalog);
  const totalWeight = entries.reduce((s, [, sp]) => s + sp.spawnWeight, 0);
  let r = Math.random() * totalWeight;
  for (const [id, sp] of entries) {
    r -= sp.spawnWeight;
    if (r <= 0) return id;
  }
  return entries[0][0];
}

function startSpawnLoop(client, guildId) {
  if (spawnTimers.has(guildId)) clearInterval(spawnTimers.get(guildId));
  const config   = getConfig(guildId);
  const interval = (config.intervalMinutes || 30) * 60_000;
  const timer    = setInterval(() => triggerSpawn(client, guildId), interval);
  spawnTimers.set(guildId, timer);
}

async function triggerSpawn(client, guildId) {
  const config = getConfig(guildId);
  if (!config.channels.length) return;

  const { getCurrentPrice }  = require('./marketManager');
  const { buildSpawnEmbed, buildSpawnExpiredEmbed } = require('../public/spawnPublic');

  // Spawn ในทุก channel พร้อมกัน — แต่ละห้องได้สัตว์คนละตัวสุ่มอิสระ
  await Promise.all(config.channels.map(async (channelId) => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    // ข้ามถ้าห้องนี้ยัง spawn อยู่
    const spawnKey = `${guildId}_${channelId}`;
    if (activeSpawns.has(spawnKey)) return;

    const speciesId   = pickSpecies();
    const species     = catalog[speciesId];
    const marketPrice = getCurrentPrice(guildId, speciesId);
    const { embed, row } = buildSpawnEmbed(guildId, channelId, speciesId, species, marketPrice);

    let msg;
    try { msg = await channel.send({ embeds: [embed], components: [row] }); }
    catch { return; }

    activeSpawns.set(spawnKey, { messageId: msg.id, speciesId, guildId, channelId, expiresAt: Date.now() + 300_000 });

    setTimeout(async () => {
      activeSpawns.delete(spawnKey);
      try { await msg.edit({ embeds: [buildSpawnExpiredEmbed(species)], components: [] }); } catch {}
    }, 300_000);
  }));
}

function getActiveSpawn(guildId, channelId) {
  return activeSpawns.get(`${guildId}_${channelId}`) || null;
}

function clearSpawn(guildId, channelId) {
  activeSpawns.delete(`${guildId}_${channelId}`);
}

function initAllSpawns(client) {
  const data = load();
  for (const [guildId, cfg] of Object.entries(data)) {
    if (cfg.channels?.length) startSpawnLoop(client, guildId);
  }
}

module.exports = { setupChannel, removeChannel, getConfig, pickSpecies, startSpawnLoop, triggerSpawn, getActiveSpawn, clearSpawn, initAllSpawns };
