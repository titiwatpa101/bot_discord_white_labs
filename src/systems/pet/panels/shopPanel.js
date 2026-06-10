const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { FOOD_CATALOG } = require('../managers/petManager');

const QTY_OPTIONS = [1, 5, 10];

function build(userId, user) {
  const uid    = userId;
  const coins  = user.coins || 0;

  const lines = Object.entries(FOOD_CATALOG).map(([id, f]) =>
    `${f.name}  —  **${f.price}c** (+${f.exp} EXP)  •  มีอยู่: ${user.food[id] || 0} ชิ้น`
  );

  const embed = new EmbedBuilder()
    .setTitle('🏪 ร้านค้าอาหาร')
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2)
    .setFooter({ text: `💰 เหรียญของคุณ: ${coins.toLocaleString()} coins` });

  const options = [];
  for (const [id, f] of Object.entries(FOOD_CATALOG)) {
    for (const qty of QTY_OPTIONS) {
      const total = f.price * qty;
      if (total <= coins || true) { // always show, disable handled via coins check in handler
        options.push({
          label:       `${f.name} × ${qty}`,
          description: `${total.toLocaleString()} coins  →  +${f.exp * qty} EXP รวม`,
          value:       `${id}__${qty}`,
          emoji:       '🛒',
        });
      }
    }
  }

  const row1 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`petsel_shop_${uid}`)
      .setPlaceholder('เลือกอาหารที่ต้องการซื้อ...')
      .addOptions(options)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
