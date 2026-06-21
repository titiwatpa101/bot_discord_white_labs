const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR, RARITY_BADGE } = require('./constants');
const { enhanceLevelLabel } = require('../managers/enhanceManager');
const catalog = require('../data/catalog.json');

function build(userId, user) {
  const uid  = userId;
  const pets = user.pets;

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ระบบตีบวก')
    .setColor(0xfee75c);

  if (pets.length === 0) {
    embed.setDescription('❌ ไม่มีสัตว์ในคลัง');
    return {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      )],
    };
  }

  const lines = pets.slice(0, 12).map((p, i) => {
    const sp    = catalog[p.speciesId];
    const badge = RARITY_BADGE[sp?.rarity] || '⚪';
    const enh   = enhanceLevelLabel(p.enhanceLevel);
    return `${badge} ${sp?.emoji || '🐾'} **${sp?.name || p.speciesId}**${enh}  Lv.${p.level}`;
  });

  if (pets.length > 12) lines.push(`*... อีก ${pets.length - 12} ตัว*`);

  embed.setDescription('เลือกสัตว์ที่ต้องการตีบวก:\n\n' + lines.join('\n'));

  const options = pets.slice(0, 25).map(p => {
    const sp  = catalog[p.speciesId];
    const enh = p.enhanceLevel > 0 ? ` +${p.enhanceLevel}` : ' +0';
    return {
      label:       `${sp?.name || p.speciesId}${enh}  Lv.${p.level}`,
      description: `${RARITY_LABEL[sp?.rarity] || ''}  •  Pity: ${Object.values(p.pityStack || {}).reduce((a, b) => a + b, 0)}`,
      value:       p.instanceId,
      emoji:       sp?.emoji || '🐾',
    };
  });

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_enhance_${uid}`)
          .setPlaceholder('เลือกสัตว์...')
          .addOptions(options)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      ),
    ],
  };
}

module.exports = { build };
