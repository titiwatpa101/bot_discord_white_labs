const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR, RARITY_BADGE } = require('./constants');
const { calcRate, getMaxRate, BASE_RATE, COMP_RATE, PET_RARITY_MULT, BOOST_BONUS, MAT_FLAT_RATE } = require('../managers/enhanceManager');
const catalog = require('../data/catalog.json');

const RARITY_EMOJI = { mythic: '🔱', common: '⚪', uncommon: '🟢', rare: '🔷', epic: '💜', legendary: '⭐' };
const MYTHIC_MAT_TIERS = new Set(['epic', 'legendary', 'mythic']);
const BOOST_LABELS = ['—', '⬆️S (+10%)', '⬆️M (+20%)'];
const NEXT_BOOST   = [1, 2, 0];
const FILTER_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

function build(userId, user, session) {
  const { targetInstId, materialInstIds = [], protect = false, boost = 0, matFilter = null } = session;
  const pet = user.pets.find(p => p.instanceId === targetInstId);

  if (!pet) {
    return {
      embeds: [new EmbedBuilder().setDescription('❌ ไม่พบสัตว์ กรุณาเริ่มใหม่').setColor(0xed4245)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${userId}_enhance`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      )],
    };
  }

  const sp        = catalog[pet.speciesId];
  const petRarity = sp?.rarity || 'common';
  const target    = (pet.enhanceLevel || 0) + 1;
  const isMythicTarget = petRarity === 'mythic';

  const matPets = materialInstIds
    .map(id => user.pets.find(p => p.instanceId === id))
    .filter(Boolean);

  const base       = BASE_RATE[target] || 0;
  const comp       = COMP_RATE[target] || 0;
  const petMult    = PET_RARITY_MULT[petRarity] || 1;
  const pityCount  = ((pet.pityStack || {})[String(target)]) || 0;
  const cap        = getMaxRate(target, petRarity);
  const rate       = calcRate(pet, matPets, boost);
  const petContrib = (base + pityCount * comp) * petMult;
  const matContrib = matPets.reduce((s, m) => {
    const mr = catalog[m.speciesId]?.rarity || 'common';
    return s + (MAT_FLAT_RATE[mr] || 0.05);
  }, 0);
  const boostContrib = BOOST_BONUS[boost] || 0;

  const protectItem = user.items?.card_protect || 0;
  const boostSItem  = user.items?.card_boost_s  || 0;
  const boostMItem  = user.items?.card_boost_m  || 0;

  const matLine = matPets.length > 0
    ? matPets.map(m => {
        const ms = catalog[m.speciesId];
        const enh = m.enhanceLevel > 0 ? ` +${m.enhanceLevel}` : '';
        return `${RARITY_EMOJI[ms?.rarity || 'common']} ${ms?.name || m.speciesId}${enh}`;
      }).join('\n')
    : '—';

  const lines = [
    `${RARITY_LABEL[petRarity]}  •  Lv.**${pet.level}**`,
    `**+${pet.enhanceLevel || 0}** → **+${target}**  *(สูงสุด ${(cap * 100).toFixed(0)}%)*`,
    '',
    `**🐾 วัสดุ (${matPets.length}/7):**`,
    matLine,
    '',
    '**📊 โอกาสสำเร็จ:**',
    `\`สัตว์  \`  **${(petContrib * 100).toFixed(1)}%**${pityCount > 0 ? `  *(Pity ×${pityCount})*` : ''}`,
    `\`+วัสดุ \`  ${matContrib > 0 ? `**+${(matContrib * 100).toFixed(1)}%**` : '—'}`,
    boost > 0 ? `\`+บัตร  \`  **+${(boostContrib * 100).toFixed(0)}%**` : `\`+บัตร  \`  —`,
    `\`ป้องกัน\`  ${protect ? '**เปิด** 🛡️' : 'ปิด'}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `✅  **รวม ${(rate * 100).toFixed(1)}%**`,
  ];

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ตีบวก — ${sp?.emoji || ''} ${sp?.name || pet.speciesId}`)
    .setColor(RARITY_COLOR[petRarity] || 0xfee75c)
    .setDescription(lines.join('\n'));

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  // ── available materials (filtered by rarity tier + matFilter) ──
  const allAvailable = user.pets.filter(p => {
    if (p.instanceId === targetInstId) return false;
    if (isMythicTarget) {
      const mr = catalog[p.speciesId]?.rarity || 'common';
      return MYTHIC_MAT_TIERS.has(mr);
    }
    return true;
  });

  const filtered = matFilter
    ? allAvailable.filter(p => (catalog[p.speciesId]?.rarity || 'common') === matFilter)
    : allAvailable;

  // Count by rarity for filter buttons
  const rarCounts = {};
  for (const p of allAvailable) {
    const r = catalog[p.speciesId]?.rarity || 'common';
    rarCounts[r] = (rarCounts[r] || 0) + 1;
  }

  // Row 0: rarity filter buttons
  const filterBtns = FILTER_ORDER
    .filter(r => rarCounts[r])
    .slice(0, 4)
    .map(r => new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_efilter_${r}`)
      .setLabel(`${RARITY_BADGE[r]} ${rarCounts[r]}`)
      .setStyle(matFilter === r ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

  filterBtns.push(
    new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_efilter_all`)
      .setLabel('📋 ทั้งหมด')
      .setStyle(!matFilter ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const row0 = new ActionRowBuilder().addComponents(filterBtns.slice(0, 5));

  // Row 1: material dropdown
  const options = filtered.slice(0, 25).map(p => {
    const ms  = catalog[p.speciesId];
    const enh = p.enhanceLevel > 0 ? ` +${p.enhanceLevel}` : '';
    return {
      label:       `${ms?.name || p.speciesId}${enh}  Lv.${p.level}`.slice(0, 100),
      description: `${RARITY_LABEL[ms?.rarity || 'common']}  •  +${(MAT_FLAT_RATE[ms?.rarity || 'common'] * 100 || 5).toFixed(0)}% เรท`.slice(0, 100),
      value:       p.instanceId,
      emoji:       RARITY_EMOJI[ms?.rarity || 'common'],
      default:     materialInstIds.includes(p.instanceId),
    };
  });

  const hasOpts   = options.length > 0;
  const maxSelect = Math.min(7, Math.max(1, options.length));

  const row1 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`petsel_emat_${userId}`)
      .setPlaceholder(hasOpts ? `เลือกวัสดุ (สูงสุด ${maxSelect})${matFilter ? ` — ${RARITY_LABEL[matFilter]}` : ''}` : '— ไม่มีสัตว์ —')
      .setMinValues(0)
      .setMaxValues(maxSelect)
      .addOptions(hasOpts ? options : [{ label: '— ไม่มีสัตว์ —', value: '__none__' }])
      .setDisabled(!hasOpts)
  );

  // Row 2: control buttons
  const nextBoost   = NEXT_BOOST[boost];
  const boostDisabled = (nextBoost === 1 && boostSItem <= 0 && boost === 0) ||
                        (nextBoost === 2 && boostMItem <= 0 && boost === 1);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_eprot`)
      .setLabel(protect ? '🛡️ ON' : '🛡️ OFF')
      .setStyle(protect ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!protect && protectItem <= 0),
    new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_eboost`)
      .setLabel(`⬆️ ${BOOST_LABELS[boost]}`)
      .setStyle(boost > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(boostDisabled),
    new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_doenhance`)
      .setLabel(`⚔️ ตีบวก! (${(rate * 100).toFixed(1)}%)`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(target > 10),
    new ButtonBuilder()
      .setCustomId(`pet_act_${userId}_eclear`)
      .setLabel('🗑️ ล้าง')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(matPets.length === 0 && !protect && boost === 0),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${userId}_enhance`)
      .setLabel('◀ กลับ')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row0, row1, row2] };
}

module.exports = { build };
