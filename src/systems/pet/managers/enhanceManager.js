const catalog = require('../data/catalog.json');

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_RATE = {
  1: 1.00, 2: 1.00, 3: 0.70,
  4: 0.50, 5: 0.35, 6: 0.25,
  7: 0.18, 8: 0.12, 9: 0.08, 10: 0.05,
};

const COMP_RATE = {
  1: 0,    2: 0,    3: 0.10,
  4: 0.08, 5: 0.06, 6: 0.05,
  7: 0.04, 8: 0.03, 9: 0.02, 10: 0.01,
};

// Multiplier applied to (base + pity) based on pet rarity
const PET_RARITY_MULT = {
  common: 1.5, uncommon: 1.2, rare: 1.0, epic: 0.8, legendary: 0.6,
};

// Multiplier applied to base rate per material
const MAT_RARITY_MULT = {
  common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16,
};

// Max success rate cap by target level and pet rarity
const MAX_RATE = {
  1:  { common: 1.00, uncommon: 1.00, rare: 1.00, epic: 1.00, legendary: 1.00 },
  2:  { common: 1.00, uncommon: 1.00, rare: 1.00, epic: 1.00, legendary: 1.00 },
  3:  { common: 0.80, uncommon: 0.80, rare: 0.80, epic: 0.80, legendary: 0.80 },
  4:  { common: 0.80, uncommon: 0.80, rare: 0.80, epic: 0.80, legendary: 0.80 },
  5:  { common: 0.80, uncommon: 0.80, rare: 0.80, epic: 0.80, legendary: 0.80 },
  6:  { common: 0.50, uncommon: 0.42, rare: 0.33, epic: 0.22, legendary: 0.12 },
  7:  { common: 0.40, uncommon: 0.33, rare: 0.25, epic: 0.16, legendary: 0.09 },
  8:  { common: 0.30, uncommon: 0.24, rare: 0.18, epic: 0.11, legendary: 0.06 },
  9:  { common: 0.20, uncommon: 0.16, rare: 0.11, epic: 0.07, legendary: 0.04 },
  10: { common: 0.12, uncommon: 0.09, rare: 0.07, epic: 0.04, legendary: 0.02 },
};

// On fail: random drop to range [min, max]. null = stay
const FAIL_DROP = {
  1: null, 2: null, 3: null,
  4: [2, 3], 5: [2, 4], 6: [3, 5],
  7: [3, 6], 8: [4, 7], 9: [4, 8], 10: [5, 9],
};

// Coin drop bonus multiplier per enhance level
const ENHANCE_COIN_BONUS = {
  0: 0, 1: 0.15, 2: 0.35, 3: 0.65, 4: 1.10,
  5: 1.80, 6: 2.90, 7: 4.50, 8: 6.80, 9: 10.00, 10: 14.50,
};

// Market price multiplier per enhance level (applies from +5)
const ENHANCE_PRICE_MULT = {
  0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0,
  5: 2.0, 6: 3.2, 7: 5.0, 8: 8.0, 9: 13.0, 10: 20.0,
};

// Boost card bonus to rate
const BOOST_BONUS = { 0: 0, 1: 0.10, 2: 0.20 };

// ─── Rate Calculation ─────────────────────────────────────────────────────────

function calcRate(pet, materials = [], boostCard = 0) {
  const target    = (pet.enhanceLevel || 0) + 1;
  if (target > 10) return 0;

  const sp        = catalog[pet.speciesId];
  const petRarity = sp?.rarity || 'common';
  const pity      = ((pet.pityStack || {})[String(target)]) || 0;

  const base      = BASE_RATE[target] || 0;
  const comp      = COMP_RATE[target] || 0;
  const petMult   = PET_RARITY_MULT[petRarity] || 1.0;
  const cap       = (MAX_RATE[target] || {})[petRarity] ?? 0.80;

  let raw = (base + pity * comp) * petMult;

  for (const mat of materials) {
    const matSp  = catalog[mat.speciesId];
    const matRar = matSp?.rarity || 'common';
    raw += base * (MAT_RARITY_MULT[matRar] || 1);
  }

  raw += BOOST_BONUS[boostCard] || 0;

  return Math.min(cap, Math.max(0, raw));
}

// ─── Execute Enhancement ──────────────────────────────────────────────────────

function enhance(pet, materials, useProtect, boostCard = 0) {
  const target = (pet.enhanceLevel || 0) + 1;
  if (target > 10) return { success: false, newLevel: pet.enhanceLevel || 0, reason: 'maxLevel' };

  const rate    = calcRate(pet, materials, boostCard);
  const roll    = Math.random();
  const success = roll < rate;

  if (!pet.pityStack) pet.pityStack = {};
  const key = String(target);

  if (success) {
    pet.enhanceLevel  = target;
    pet.pityStack[key] = 0;
    return { success: true, newLevel: target, rate, roll };
  }

  // Fail — increment pity for this target level
  pet.pityStack[key] = (pet.pityStack[key] || 0) + 1;

  if (useProtect) {
    return { success: false, newLevel: pet.enhanceLevel || 0, protected: true, rate, roll };
  }

  // Level drop
  const dropRange = FAIL_DROP[target];
  if (!dropRange) {
    return { success: false, newLevel: pet.enhanceLevel || 0, protected: false, dropped: 0, rate, roll };
  }

  const [minDrop, maxDrop] = dropRange;
  const current    = pet.enhanceLevel || 0;
  const clampedMin = Math.min(minDrop, current);
  const clampedMax = Math.min(maxDrop, current);
  const newLevel   = clampedMin >= clampedMax
    ? clampedMin
    : clampedMin + Math.floor(Math.random() * (clampedMax - clampedMin + 1));

  const dropped       = current - newLevel;
  pet.enhanceLevel    = newLevel;
  return { success: false, newLevel, dropped, protected: false, rate, roll };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEnhancePriceMult(enhanceLevel) {
  return ENHANCE_PRICE_MULT[enhanceLevel || 0] ?? 1.0;
}

function getEnhanceCoinBonus(enhanceLevel) {
  return ENHANCE_COIN_BONUS[enhanceLevel || 0] ?? 0;
}

function getMaxRate(targetLevel, petRarity) {
  return (MAX_RATE[targetLevel] || {})[petRarity] ?? 0.80;
}

function enhanceLevelLabel(level) {
  if (!level || level === 0) return '';
  return ` **+${level}**`;
}

module.exports = {
  calcRate, enhance,
  getEnhancePriceMult, getEnhanceCoinBonus, getMaxRate, enhanceLevelLabel,
  BASE_RATE, COMP_RATE, PET_RARITY_MULT, MAT_RARITY_MULT, MAX_RATE,
  FAIL_DROP, ENHANCE_COIN_BONUS, ENHANCE_PRICE_MULT, BOOST_BONUS,
};
