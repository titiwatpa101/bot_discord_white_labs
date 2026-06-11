const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR } = require('./constants');
const { calcRate, getMaxRate, BASE_RATE, COMP_RATE, PET_RARITY_MULT, BOOST_BONUS } = require('../managers/enhanceManager');
const { ITEM_CATALOG } = require('../managers/petManager');
const catalog = require('../data/catalog.json');

const RARITY_KEYS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_EMOJI = { common: '⚪', uncommon: '🟢', rare: '🔷', epic: '💜', legendary: '⭐' };

// ─── State encode / decode ────────────────────────────────────────────────────

function encodeState(instId, mats, protect, boost) {
  return `${instId}:c${mats.c}:u${mats.u}:r${mats.r}:e${mats.e}:l${mats.l}:P${protect ? 1 : 0}:B${boost}`;
}

function decodeState(stateStr) {
  // stateStr = "INSTID:c3:u1:r0:e0:l0:P1:B2"
  const parts  = stateStr.split(':');
  const instId = parts[0];
  const mats   = {
    c: parseInt(parts[1]?.slice(1) || '0', 10),
    u: parseInt(parts[2]?.slice(1) || '0', 10),
    r: parseInt(parts[3]?.slice(1) || '0', 10),
    e: parseInt(parts[4]?.slice(1) || '0', 10),
    l: parseInt(parts[5]?.slice(1) || '0', 10),
  };
  const protect = parseInt(parts[6]?.slice(1) || '0', 10) === 1;
  const boost   = parseInt(parts[7]?.slice(1) || '0', 10);
  return { instId, mats, protect, boost };
}

// Count available pets by rarity (excluding pet being enhanced)
function countAvailable(userPets, excludeInstId) {
  const av = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  for (const p of userPets) {
    if (p.instanceId === excludeInstId) continue;
    const sp = catalog[p.speciesId];
    if (sp?.rarity) av[sp.rarity] = (av[sp.rarity] || 0) + 1;
  }
  return av;
}

// Build list of material pet objects from user's inventory
function resolveMats(userPets, excludeInstId, mats) {
  const rarityQueue = {};
  for (const p of userPets) {
    if (p.instanceId === excludeInstId) continue;
    const sp = catalog[p.speciesId];
    const r  = sp?.rarity || 'common';
    if (!rarityQueue[r]) rarityQueue[r] = [];
    rarityQueue[r].push(p);
  }
  const result = [];
  const counts = { c: 'common', u: 'uncommon', r: 'rare', e: 'epic', l: 'legendary' };
  for (const [key, rarity] of Object.entries(counts)) {
    const n = mats[key] || 0;
    const q = rarityQueue[rarity] || [];
    for (let i = 0; i < Math.min(n, q.length); i++) result.push(q[i]);
  }
  return result;
}

// ─── Panel Builder ────────────────────────────────────────────────────────────

function build(userId, user, stateStr) {
  const uid            = userId;
  const { instId, mats, protect, boost } = decodeState(stateStr);
  const pet            = user.pets.find(p => p.instanceId === instId);

  if (!pet) {
    const { EmbedBuilder } = require('discord.js');
    return {
      embeds: [new EmbedBuilder().setDescription('❌ ไม่พบสัตว์').setColor(0xed4245)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      )],
    };
  }

  const sp         = catalog[pet.speciesId];
  const petRarity  = sp?.rarity || 'common';
  const target     = (pet.enhanceLevel || 0) + 1;
  const available  = countAvailable(user.pets, instId);
  const totalMats  = mats.c + mats.u + mats.r + mats.e + mats.l;
  const matPets    = resolveMats(user.pets, instId, mats);
  const rate       = calcRate(pet, matPets, boost);
  const pityCount  = ((pet.pityStack || {})[String(target)]) || 0;
  const cap        = getMaxRate(target, petRarity);
  const base       = BASE_RATE[target] || 0;
  const comp       = COMP_RATE[target] || 0;
  const petMult    = PET_RARITY_MULT[petRarity] || 1.0;

  const protectItem = user.items?.card_protect || 0;
  const boostSItem  = user.items?.card_boost_s  || 0;
  const boostMItem  = user.items?.card_boost_m  || 0;

  // Rate breakdown
  const baseContrib = ((base + pityCount * comp) * petMult * 100).toFixed(1);
  const matContrib  = matPets.reduce((s, m) => {
    const mr = catalog[m.speciesId]?.rarity || 'common';
    const mult = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 }[mr] || 1;
    return s + base * mult;
  }, 0);
  const boostContrib = BOOST_BONUS[boost] || 0;

  const matLine = Object.entries({ c: 'common', u: 'uncommon', r: 'rare', e: 'epic', l: 'legendary' })
    .filter(([k]) => mats[k] > 0)
    .map(([k, rarity]) => `${RARITY_EMOJI[rarity]}×${mats[k]}`)
    .join(' ');

  const pityLine = pityCount > 0
    ? `Pity: **${pityCount}** ครั้ง (+${(pityCount * comp * petMult * 100).toFixed(1)}%)`
    : `Pity: 0 ครั้ง`;

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ตีบวก — ${sp?.emoji || ''} ${sp?.name || pet.speciesId}`)
    .setColor(RARITY_COLOR[petRarity] || 0xfee75c)
    .setDescription(
      `${RARITY_LABEL[petRarity]}  •  Lv.**${pet.level}**\n` +
      `ระดับปัจจุบัน: **+${pet.enhanceLevel || 0}**  →  เป้าหมาย: **+${target}**\n\n` +
      `**Rate Analysis:**\n` +
      `Base: ${baseContrib}%  ${pityLine}\n` +
      `วัสดุ: ${matLine || '—'}  (+${(matContrib * 100).toFixed(1)}%)\n` +
      `บัตร: ${boost > 0 ? `+${(boostContrib * 100).toFixed(0)}%` : '—'}\n` +
      `🛡️ ป้องกัน: ${protect ? '**เปิด**' : 'ปิด'}\n\n` +
      `**✅ Rate รวม: ${(rate * 100).toFixed(1)}%**  (สูงสุด ${(cap * 100).toFixed(0)}%)\n` +
      `วัสดุที่เลือก: **${totalMats}/7** ตัว`
    );

  // Row 1: +mats
  const row1 = new ActionRowBuilder().addComponents(
    ['c', 'u', 'r', 'e', 'l'].map(k => {
      const rarity = { c: 'common', u: 'uncommon', r: 'rare', e: 'epic', l: 'legendary' }[k];
      const newMats = { ...mats, [k]: mats[k] + 1 };
      return new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_emat_${encodeState(instId, newMats, protect, boost)}`)
        .setLabel(`+${RARITY_EMOJI[rarity]}`)
        .setStyle(ButtonStyle.Success)
        .setDisabled(totalMats >= 7 || mats[k] >= available[rarity]);
    })
  );

  // Row 2: -mats (always append :_k suffix so customIds are always unique)
  const row2 = new ActionRowBuilder().addComponents(
    ['c', 'u', 'r', 'e', 'l'].map(k => {
      const rarity = { c: 'common', u: 'uncommon', r: 'rare', e: 'epic', l: 'legendary' }[k];
      const newMats = { ...mats, [k]: Math.max(0, mats[k] - 1) };
      return new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_emat_${encodeState(instId, newMats, protect, boost)}:_${k}`)
        .setLabel(`-${RARITY_EMOJI[rarity]}(${mats[k]})`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(mats[k] <= 0);
    })
  );

  // Row 3: cards + enhance + clear + back
  const nextBoost = boost >= 2 ? 0 : boost + 1;
  const boostLabel = ['—', '⬆️S', '⬆️M'][boost];
  const boostDisabled = (nextBoost === 1 && boostSItem <= 0) || (nextBoost === 2 && boostMItem <= 0) || (nextBoost === 0);

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_emat_${encodeState(instId, mats, !protect, boost)}`)
      .setLabel(`🛡️ ${protect ? 'ป้องกัน: ON' : 'ป้องกัน: OFF'}`)
      .setStyle(protect ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!protect && protectItem <= 0),
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_emat_${encodeState(instId, mats, protect, nextBoost)}`)
      .setLabel(`เรท: ${boostLabel}`)
      .setStyle(boost > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(nextBoost === 1 && boostSItem <= 0 && boost === 0 || nextBoost === 2 && boostMItem <= 0 && boost === 1),
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_doenhance_${encodeState(instId, mats, protect, boost)}`)
      .setLabel(`⚔️ ตีบวก! (${(rate * 100).toFixed(1)}%)`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(target > 10),
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_emat_${encodeState(instId, { c: 0, u: 0, r: 0, e: 0, l: 0 }, false, 0)}`)
      .setLabel('🗑️ ล้าง')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(totalMats === 0 && !protect && boost === 0),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_enhance`)
      .setLabel('◀ กลับ')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2, row3] };
}

module.exports = { build, decodeState, encodeState, resolveMats };
