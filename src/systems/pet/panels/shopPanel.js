const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { FOOD_CATALOG, ITEM_CATALOG } = require('../managers/petManager');

function build(userId, user) {
  const uid   = userId;
  const coins = user.coins || 0;

  const foodLines = Object.entries(FOOD_CATALOG).map(([id, f]) =>
    `${f.name}  —  **${f.price.toLocaleString()}c**/ชิ้น  (+${f.exp} EXP)  คลัง: ${user.food[id] || 0}`
  );
  const cardLines = Object.entries(ITEM_CATALOG).map(([id, it]) =>
    `${it.name}  —  **${it.price.toLocaleString()}c**  คลัง: ${user.items?.[id] || 0}`
  );

  const embed = new EmbedBuilder()
    .setTitle('🏪 ร้านค้า')
    .addFields(
      { name: '🍖 อาหาร', value: foodLines.join('\n') },
      { name: '🃏 บัตรตีบวก', value: cardLines.join('\n') },
    )
    .setColor(0x5865f2)
    .setFooter({ text: `💰 เหรียญของคุณ: ${coins.toLocaleString()} coins` });

  const foodOptions = Object.entries(FOOD_CATALOG).map(([id, f]) => ({
    label:       f.name,
    description: `${f.price.toLocaleString()} coins/ชิ้น  •  +${f.exp} EXP/ชิ้น`,
    value:       id,
    emoji:       coins >= f.price ? '🛒' : '💸',
  }));

  const row1 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`petsel_shopitem_${uid}`)
      .setPlaceholder('🍖 เลือกอาหาร...')
      .addOptions(foodOptions)
  );

  const row2 = new ActionRowBuilder().addComponents(
    ...Object.entries(ITEM_CATALOG).map(([id, it]) =>
      new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_buycard_${id}`)
        .setLabel(`${it.name} (${it.price.toLocaleString()}c)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(coins < it.price)
    )
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2, row3] };
}

module.exports = { build };
