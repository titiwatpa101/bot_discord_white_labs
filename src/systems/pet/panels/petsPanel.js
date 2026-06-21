const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_BADGE, RARITY_COLOR } = require('./constants');
const { enhanceLevelLabel } = require('../managers/enhanceManager');
const catalog = require('../data/catalog.json');

const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
const RARITY_HEADER = {
  mythic:    '🔱 MYTHIC',
  legendary: '⭐ LEGENDARY',
  epic:      '💜 EPIC',
  rare:      '🔷 RARE',
  uncommon:  '🟢 UNCOMMON',
  common:    '⚪ COMMON',
};

function build(userId, user, filterRarity) {
  const uid  = userId;
  const pets = user.pets;

  if (!pets.length) {
    return {
      embeds: [new EmbedBuilder()
        .setTitle('📦 คลังสัตว์เลี้ยง')
        .setDescription('*ยังไม่มีสัตว์ — รอ spawn หรือ Wonder Trade*')
        .setColor(0x5865f2)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
        ),
      ],
    };
  }

  const grouped = {};
  for (const r of RARITY_ORDER) grouped[r] = [];
  for (const p of pets) {
    const sp = catalog[p.speciesId];
    const r  = sp?.rarity || 'common';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(p);
  }

  const counts = RARITY_ORDER
    .filter(r => grouped[r].length > 0)
    .map(r => `${RARITY_HEADER[r]} ×${grouped[r].length}`)
    .join('\n');

  const active = filterRarity || null;
  const shown  = active ? (grouped[active] || []) : pets;

  const lines = shown.slice(0, 15).map((p, i) => {
    const sp    = catalog[p.speciesId];
    const badge = RARITY_BADGE[sp?.rarity] || '⚪';
    const enh   = enhanceLevelLabel(p.enhanceLevel);
    const isAct = pets[0]?.instanceId === p.instanceId ? ' ★' : '';
    return `${badge} ${sp?.emoji || '🐾'} **${sp?.name || p.speciesId}**${enh}  Lv.${p.level}${isAct}`;
  });

  if (shown.length > 15) {
    lines.push(`*... อีก ${shown.length - 15} ตัว*`);
  }

  const embed = new EmbedBuilder()
    .setTitle(`📦 คลังสัตว์เลี้ยง — ${pets.length} ตัว`)
    .setColor(active ? (RARITY_COLOR[active] || 0x5865f2) : 0x5865f2)
    .addFields(
      { name: '📊 สรุปตามระดับ', value: counts },
      { name: active ? `${RARITY_HEADER[active]}` : '📋 ทั้งหมด', value: lines.join('\n') || '—' },
    );

  const components = [];

  // Row 1: rarity filter buttons
  const filterBtns = RARITY_ORDER
    .filter(r => grouped[r].length > 0)
    .slice(0, 5)
    .map(r => new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_pets_${r}`)
      .setLabel(`${RARITY_BADGE[r]} ${grouped[r].length}`)
      .setStyle(active === r ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

  if (filterBtns.length > 1) {
    if (active) {
      filterBtns.push(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('📋 ทั้งหมด').setStyle(ButtonStyle.Secondary)
      );
    }
    components.push(new ActionRowBuilder().addComponents(filterBtns.slice(0, 5)));
  }

  // Row 2: pet select dropdown (shown pets only)
  const selectPets = shown.slice(0, 25);
  if (selectPets.length > 0) {
    const options = selectPets.map(p => {
      const sp    = catalog[p.speciesId];
      const badge = RARITY_BADGE[sp?.rarity] || '⚪';
      const enh   = p.enhanceLevel > 0 ? ` +${p.enhanceLevel}` : '';
      return {
        label:       `${sp?.name || p.speciesId}${enh}  Lv.${p.level}`,
        description: `${badge} ${(sp?.rarity || '').toUpperCase()}  •  EXP ${p.exp}/${Math.floor(100 * Math.pow(p.level, 1.5))}`,
        value:       p.instanceId,
        emoji:       sp?.emoji || '🐾',
      };
    });

    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`petsel_pet_${uid}`)
        .setPlaceholder('เลือกสัตว์เพื่อดูรายละเอียด...')
        .addOptions(options)
    ));
  }

  // Row 3: back
  components.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
  ));

  return { embeds: [embed], components };
}

module.exports = { build };
