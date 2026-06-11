const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { FOOD_CATALOG } = require('../managers/petManager');

const QTY_OPTIONS = [1, 5, 10, 20, 50, 100];

function build(userId, guildId, user, foodId) {
  const uid   = userId;
  const food  = FOOD_CATALOG[foodId];
  const coins = user.coins || 0;

  const embed = new EmbedBuilder()
    .setTitle(`🛒 ซื้ออาหาร — ${food?.name || foodId}`)
    .setDescription(
      `ราคา **${food?.price?.toLocaleString() || 0} coins/ชิ้น**  •  +${food?.exp || 0} EXP/ชิ้น\n` +
      `คลังปัจจุบัน: **${user.food[foodId] || 0} ชิ้น**\n\n` +
      `💰 เหรียญของคุณ: **${coins.toLocaleString()} coins**\n\n` +
      `เลือกจำนวนที่ต้องการซื้อ:`
    )
    .setColor(0x5865f2);

  // Row 1 & 2 split by 3 buttons each (max 5 per row)
  const row1 = new ActionRowBuilder().addComponents(
    QTY_OPTIONS.slice(0, 3).map(qty => {
      const cost = (food?.price || 0) * qty;
      return new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_buyqty_${foodId}:${qty}`)
        .setLabel(`×${qty}  (${cost.toLocaleString()}c)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(coins < cost);
    })
  );

  const row2 = new ActionRowBuilder().addComponents(
    QTY_OPTIONS.slice(3).map(qty => {
      const cost = (food?.price || 0) * qty;
      return new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_buyqty_${foodId}:${qty}`)
        .setLabel(`×${qty}  (${cost.toLocaleString()}c)`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(coins < cost);
    })
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_shop`)
      .setLabel('◀ กลับเลือกอาหาร')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2, row3] };
}

module.exports = { build };
