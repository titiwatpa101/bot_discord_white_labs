const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { FOOD_CATALOG } = require('../managers/petManager');
const catalog           = require('../data/catalog.json');
const { expBar, expToNext } = require('../managers/petManager');

function build(userId, user) {
  const uid    = userId;
  const active = user.pets[0];
  const sp     = active ? catalog[active.speciesId] : null;

  const bar    = active ? expBar(active.exp, active.level) : '';
  const needed = active ? expToNext(active.level) : 0;

  const embed = new EmbedBuilder()
    .setTitle('🍖 ให้อาหาร')
    .setDescription(
      active
        ? `**Active:** ${sp?.emoji || ''} ${sp?.name || '-'}  Lv.${active.level}\n` +
          `\`${bar}\`  ${active.exp}/${needed} EXP\n\nเลือกอาหารที่ต้องการให้:`
        : '❌ ไม่มีสัตว์ที่ active อยู่'
    )
    .setColor(0x57f287);

  if (!active) {
    return {
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
        )
      ]
    };
  }

  const options = Object.entries(FOOD_CATALOG)
    .filter(([id]) => (user.food[id] || 0) > 0)
    .map(([id, f]) => ({
      label:       `${f.name}  (+${f.exp} EXP)`,
      description: `มีอยู่ ${user.food[id]} ชิ้น`,
      value:       id,
    }));

  const components = [];

  if (options.length) {
    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_feed_${uid}`)
          .setPlaceholder('เลือกอาหาร...')
          .addOptions(options)
      )
    );
  } else {
    embed.setFooter({ text: 'ไม่มีอาหารในคลัง — ไปซื้อก่อนนะ 🏪' });
  }

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_shop`).setLabel('🏪 ซื้ออาหาร').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
    )
  );

  return { embeds: [embed], components };
}

module.exports = { build };
