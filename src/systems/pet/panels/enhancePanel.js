const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR } = require('./constants');
const { enhanceLevelLabel }           = require('../managers/enhanceManager');
const catalog = require('../data/catalog.json');

function build(userId, user) {
  const uid  = userId;
  const pets = user.pets;

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ระบบตีบวก')
    .setDescription(
      pets.length === 0
        ? '❌ ไม่มีสัตว์ในคลัง'
        : 'เลือกสัตว์ที่ต้องการตีบวก:\n\n' +
          pets.slice(0, 10).map((p, i) => {
            const sp  = catalog[p.speciesId];
            const lbl = RARITY_LABEL[sp?.rarity] || '';
            const enh = p.enhanceLevel > 0 ? ` **+${p.enhanceLevel}**` : '';
            return `${i + 1}. ${sp?.emoji || '🐾'} **${sp?.name || p.speciesId}**${enh}  ${lbl}  Lv.${p.level}`;
          }).join('\n')
    )
    .setColor(0xfee75c);

  if (pets.length === 0) {
    return {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      )],
    };
  }

  const options = pets.slice(0, 25).map(p => {
    const sp  = catalog[p.speciesId];
    const enh = p.enhanceLevel > 0 ? ` +${p.enhanceLevel}` : ' +0';
    return {
      label:       `${sp?.emoji || ''} ${sp?.name || p.speciesId}${enh}`,
      description: `${RARITY_LABEL[sp?.rarity] || ''}  Lv.${p.level}  Pity: ${Object.values(p.pityStack || {}).reduce((a, b) => a + b, 0)}`,
      value:       p.instanceId,
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
