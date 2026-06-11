const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { FOOD_CATALOG } = require('../managers/petManager');

function build(userId, user) {
  const uid   = userId;
  const coins = user.coins || 0;

  const lines = Object.entries(FOOD_CATALOG).map(([id, f]) =>
    `${f.name}  —  **${f.price.toLocaleString()}c** / ชิ้น  (+${f.exp} EXP)  •  คลัง: ${user.food[id] || 0}`
  );

  const embed = new EmbedBuilder()
    .setTitle('🏪 ร้านค้าอาหาร')
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2)
    .setFooter({ text: `💰 เหรียญของคุณ: ${coins.toLocaleString()} coins` });

  const options = Object.entries(FOOD_CATALOG).map(([id, f]) => ({
    label:       f.name,
    description: `${f.price.toLocaleString()} coins/ชิ้น  •  +${f.exp} EXP/ชิ้น`,
    value:       id,
    emoji:       coins >= f.price ? '🛒' : '💸',
  }));

  const row1 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`petsel_shopitem_${uid}`)
      .setPlaceholder('เลือกอาหารที่ต้องการซื้อ...')
      .addOptions(options)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
