const catalog    = require('../data/catalog.json');
const petManager = require('./petManager');

const PULL_1_COST  = 5000;
const PULL_11_COST = 50000;
const PITY_LIMIT   = 200;

const RARITY_RATE = [
  { rarity: 'common',    weight: 52    },
  { rarity: 'uncommon',  weight: 27    },
  { rarity: 'rare',      weight: 13    },
  { rarity: 'epic',      weight: 7.625 },
  { rarity: 'legendary', weight: 0.25  },
  { rarity: 'gacha_leg', weight: 0.125 },
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
  if (!pool.length) return pools.common[Math.floor(Math.random() * pools.common.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollLegendary() {
  const pools = poolByRarity();
  const all = [...pools.legendary, ...pools.gacha_leg];
  return all[Math.floor(Math.random() * all.length)];
}

function isLegendaryTier(speciesId) {
  const sp = catalog[speciesId];
  return sp?.rarity === 'legendary' || sp?.gachaExclusive;
}

function pull(guildId, userId, count) {
  const cost = count === 1 ? PULL_1_COST : PULL_11_COST;
  let user = petManager.getUser(guildId, userId);

  if ((user.coins || 0) < cost) {
    return { success: false, reason: 'insufficient', need: cost, have: user.coins || 0 };
  }

  petManager.addCoins(guildId, userId, -cost);

  const results = [];
  for (let i = 0; i < count; i++) {
    user = petManager.getUser(guildId, userId);
    const pity = user.gachaPity || 0;
    let speciesId;

    if (pity + 1 >= PITY_LIMIT) {
      speciesId = rollLegendary();
      user.gachaPity = 0;
    } else {
      speciesId = rollOne();
      if (isLegendaryTier(speciesId)) {
        user.gachaPity = 0;
      } else {
        user.gachaPity = pity + 1;
      }
    }

    petManager.saveUser(guildId, userId, user);
    const pet = petManager.addPet(guildId, userId, speciesId);
    results.push({ speciesId, pet });
  }

  user = petManager.getUser(guildId, userId);
  return { success: true, results, cost, pity: user.gachaPity };
}

module.exports = { pull, rollOne, PULL_1_COST, PULL_11_COST, PITY_LIMIT };
