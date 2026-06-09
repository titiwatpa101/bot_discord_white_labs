const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '../../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'verify_config.json');

let configs = {};

function load() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    configs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    console.log('[verify] Config loaded');
  } catch (err) {
    console.error('[verify] Failed to load config:', err.message);
  }
}

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[verify] Failed to save config:', err.message);
  }
}

function setConfig(guildId, config) {
  configs[guildId] = config;
  save();
}

function getConfig(guildId) {
  return configs[guildId] ?? null;
}

load();

module.exports = { setConfig, getConfig };
