const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_BADGE, RARITY_COLOR, RARITY_LABEL } = require('./constants');
const { enhanceLevelLabel } = require('../managers/enhanceManager');
const catalog = require('../data/catalog.json');

const MERGE_TIERS  = ['common', 'uncommon', 'rare'];
const NEXT_TIER    = { common: 'uncommon', uncommon: 'rare', rare: 'epic' };
const MERGE_COUNT  = 10;

const TIER_HEADER = {
  common:   '⚪ Common → 🟢 Uncommon',
  uncommon: '🟢 Uncommon → 🔷 Rare',
  rare:     '🔷 Rare → 💜 Epic',
};

function build(userId, user, filterRarity) {
  const uid  = userId;
  const pets = user.pets;

  const counts = {};
  for (const r of MERGE_TIERS) counts[r] = 0;
  for (const p of pets) {
    const r = catalog[p.speciesId]?.rarity || 'common';
    if (counts[r] !== undefined) counts[r]++;
  }

  const active = filterRarity && MERGE_TIERS.includes(filterRarity) ? filterRarity : null;

  const summaryLines = MERGE_TIERS.map(r => {
    const can   = counts[r] >= MERGE_COUNT;
    const times = Math.floor(counts[r] / MERGE_COUNT);
    return `${RARITY_BADGE[r]} **${r.toUpperCase()}**  ×${counts[r]}  ${can ? `✅ รวมได้ ${times} ครั้ง` : `❌ ต้องการ ${MERGE_COUNT}`}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🔄 รวมสัตว์')
    .setColor(active ? (RARITY_COLOR[active] || 0x5865f2) : 0x5865f2)
    .setDescription(
      '**ใช้สัตว์ 10 ตัวระดับเดียวกัน → สุ่มได้ 1 ตัวระดับถัดไป**\n' +
      '*(สูงสุด: Rare → Epic  |  ไม่สามารถรวม Epic ขึ้นไปได้)*\n\n' +
      summaryLines.join('\n')
    );

  const components = [];

  // Row 1: quick merge buttons — กดแล้วเลือก 10 ตัวอัตโนมัติ ไปหน้ายืนยันเลย
  const quickBtns = MERGE_TIERS.map(r =>
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_qmerge_${r}`)
      .setLabel(`${RARITY_BADGE[r]} รวม ${r.charAt(0).toUpperCase() + r.slice(1)}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(counts[r] < MERGE_COUNT)
  );
  quickBtns.push(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
  );
  components.push(new ActionRowBuilder().addComponents(quickBtns));

  // Row 2: expand tab (if user wants to pick manually)
  if (!active) {
    const tabBtns = MERGE_TIERS.map(r =>
      new ButtonBuilder()
        .setCustomId(`pet_nav_${uid}_merge_${r}`)
        .setLabel(`${RARITY_BADGE[r]} เลือกเอง`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(counts[r] < MERGE_COUNT)
    );
    components.push(new ActionRowBuilder().addComponents(tabBtns));
  }

  // Row 2-3: manual select (if filter active)
  if (active && counts[active] >= MERGE_COUNT) {
    embed.addFields({
      name: `${TIER_HEADER[active]}`,
      value: `เลือก ${MERGE_COUNT} ตัวเอง หรือกดปุ่มด้านบนเพื่อรวมอัตโนมัติ`,
    });

    const petsOfRarity = pets
      .filter(p => (catalog[p.speciesId]?.rarity || 'common') === active)
      .slice(0, 25);

    const options = petsOfRarity.map(p => {
      const sp  = catalog[p.speciesId];
      return {
        label:       `${sp?.name || p.speciesId}${p.enhanceLevel > 0 ? ` +${p.enhanceLevel}` : ''}  Lv.${p.level}`.slice(0, 100),
        description: `${RARITY_LABEL[active]}`,
        value:       p.instanceId,
        emoji:       sp?.emoji || '🐾',
      };
    });

    const maxV = Math.min(MERGE_COUNT, options.length);

    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`petsel_merge_${uid}`)
        .setPlaceholder(`เลือกสัตว์ ${MERGE_COUNT} ตัว...`)
        .setMinValues(maxV)
        .setMaxValues(maxV)
        .addOptions(options)
    ));

    components.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_merge`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
    ));
  }

  return { embeds: [embed], components };
}

function buildConfirm(userId, selectedPets, fromRarity) {
  const uid      = userId;
  const toRarity = NEXT_TIER[fromRarity];

  const lines = selectedPets.map((p, i) => {
    const sp = catalog[p.speciesId];
    return `\`${String(i + 1).padStart(2)}\`  ${sp?.emoji || '🐾'} ${sp?.name || p.speciesId}`;
  });

  const targetPool = Object.entries(catalog)
    .filter(([, sp]) => sp.rarity === toRarity && sp.spawnWeight > 0)
    .map(([, sp]) => `${sp.emoji} ${sp.name}`)
    .slice(0, 8)
    .join('、');

  const embed = new EmbedBuilder()
    .setTitle('🔄 ยืนยันรวมสัตว์')
    .setColor(RARITY_COLOR[toRarity] || 0x5865f2)
    .setDescription(
      `**${RARITY_BADGE[fromRarity]} ${fromRarity.toUpperCase()} × ${MERGE_COUNT}  →  ${RARITY_BADGE[toRarity]} ${toRarity.toUpperCase()} × 1**\n\n` +
      '**สัตว์ที่จะใช้ (หายถาวร):**\n' +
      lines.join('\n') +
      `\n\n🎲 สุ่มได้: ${targetPool} ...`
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_act_${uid}_domerge`).setLabel('🔄 รวมเลย!').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_merge_${fromRarity}`).setLabel('◀ เลือกใหม่').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_merge`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

function buildResult(speciesId) {
  const sp = catalog[speciesId];
  const embed = new EmbedBuilder()
    .setTitle('🔄 รวมสัตว์สำเร็จ!')
    .setDescription(`${sp?.emoji || '🐾'} **${sp?.name || speciesId}**\n${RARITY_LABEL[sp?.rarity] || ''}`)
    .setColor(RARITY_COLOR[sp?.rarity] || 0x5865f2);

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);
  return embed;
}

module.exports = { build, buildConfirm, buildResult, MERGE_COUNT, NEXT_TIER, MERGE_TIERS };
