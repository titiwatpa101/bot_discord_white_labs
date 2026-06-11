const fs   = require('fs');
const path = require('path');

const catalog    = require('../data/catalog.json');
const petManager = require('./petManager');
const { ENHANCE_COIN_BONUS } = require('./enhanceManager');

const USERS_PATH = path.join(__dirname, '../data/users.json');

// Coins earned per 5 minutes per rarity tier
const RARITY_BASE = {
  legendary: 30,
  epic:      12,
  rare:       5,
  uncommon:   2,
  common:     1,
};

const DROP_INTERVAL_MS = 5 * 60_000;

// Calculate coins per drop for a user (preview, doesn't modify data)
function calcDrop(user) {
  if (!user.pets || !user.pets.length) return 0;

  return user.pets.slice(0, 10).reduce((total, pet, idx) => {
    const sp = catalog[pet.speciesId];
    if (!sp) return total;
    const base        = RARITY_BASE[sp.rarity] || 1;
    const levelBonus  = Math.sqrt(pet.level || 1);
    const activeBonus = idx === 0 ? 1.5 : 1.0;
    const enhBonus    = 1 + (ENHANCE_COIN_BONUS[pet.enhanceLevel || 0] || 0);
    return total + Math.floor(base * levelBonus * activeBonus * enhBonus);
  }, 0);
}

// Human-readable income string for panel display
function dropRateLabel(user) {
  const coins = calcDrop(user);
  if (!coins) return '—';
  return `+${coins} coins / 5 นาที`;
}

function startCoinDrop(client) {
  setInterval(() => {
    try {
      if (!fs.existsSync(USERS_PATH)) return;
      const data = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));

      for (const [compositeKey, user] of Object.entries(data)) {
        if (!user.pets?.length) continue;

        const sep     = compositeKey.indexOf('_');
        if (sep === -1) continue;
        const guildId = compositeKey.slice(0, sep);
        const userId  = compositeKey.slice(sep + 1);
        if (!guildId || !userId) continue;

        const drop = calcDrop(user);
        if (drop > 0) petManager.addCoins(guildId, userId, drop);
      }
    } catch (err) {
      console.error('[pet] coinDrop tick error:', err.message);
    }
  }, DROP_INTERVAL_MS);

  console.log('🪙 Pet coin drop started (every 5 min)');
}

module.exports = { calcDrop, dropRateLabel, startCoinDrop, RARITY_BASE };
