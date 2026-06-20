const catalog    = require('../data/catalog.json');
const petManager = require('./petManager');

const PULL_1_COST  = 1000;
const PULL_11_COST = 10000;

const RARITY_RATE = [
  { rarity: 'common',    weight: 50   },
  { rarity: 'uncommon',  weight: 25   },
  { rarity: 'rare',      weight: 15   },
  { rarity: 'epic',      weight: 7    },
  { rarity: 'legendary', weight: 2.5  },
  { rarity: 'gacha_leg', weight: 0.5  },
];

const TOTAL_WEIGHT = RARITY_RATE.reduce((s, r) => s + r.weight, 0);

function poolByRarity() {
  const pools = { common: [], uncommon: [], rare: [], epic: [], legendary: [], gacha_leg: [] };
  for (const [id, sp] of Object.entries(catalog)) {
    if (sp.rarity === 'mythic') continue;
    if (sp.gachaExclusive) {
      pools.gacha_leg.push(id);
    } else if (pools[sp.rarity]) {
      pools[sp.rarity].push(id);
    }
  }
  return pools;
}

function rollOne() {
  const pools = poolByRarity();
  let roll = Math.random() * TOTAL_WEIGHT;

  let pickedRarity = 'common';
  for (const tier of RARITY_RATE) {
    roll -= tier.weight;
    if (roll <= 0) { pickedRarity = tier.rarity; break; }
  }

  const pool = pools[pickedRarity] || pools.common;
  if (!pool.length) {
    const fallback = pools.common;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function pull(guildId, userId, count) {
  const cost = count === 1 ? PULL_1_COST : PULL_11_COST;
  const user = petManager.getUser(guildId, userId);

  if ((user.coins || 0) < cost) {
    return { success: false, reason: 'insufficient', need: cost, have: user.coins || 0 };
  }

  petManager.addCoins(guildId, userId, -cost);

  const results = [];
  for (let i = 0; i < count; i++) {
    const speciesId = rollOne();
    const pet = petManager.addPet(guildId, userId, speciesId);
    results.push({ speciesId, pet });
  }

  return { success: true, results, cost };
}

module.exports = { pull, rollOne, PULL_1_COST, PULL_11_COST };
