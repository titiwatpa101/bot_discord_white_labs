const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { FOOD_CATALOG, expBar, expToNext } = require('../managers/petManager');
const catalog = require('../data/catalog.json');

const QTY_OPTIONS = [1, 5, 10, 20, 50];

function build(userId, user, foodId) {
  const uid    = userId;
  const food   = FOOD_CATALOG[foodId];
  const have   = user.food[foodId] || 0;
  const active = user.pets[0];
  const sp     = active ? catalog[active.speciesId] : null;

  const bar    = active ? expBar(active.exp, active.level) : '';
  const needed = active ? expToNext(active.level) : 0;

  const embed = new EmbedBuilder()
    .setTitle(`🍖 ให้อาหาร — ${food?.name || foodId}`)
    .setDescription(
      `**Active:** ${sp?.emoji || ''} ${sp?.name || '-'}  Lv.${active?.level || 1}\n` +
      `\`${bar}\`  ${active?.exp || 0}/${needed} EXP\n\n` +
      `คลัง: **${have} ชิ้น**  •  +${food?.exp || 0} EXP ต่อชิ้น\n\n` +
      `เลือกจำนวนที่ต้องการให้:`
    )
    .setColor(0x57f287);

  if (have === 0) {
    embed.setFooter({ text: 'ไม่มีอาหารชนิดนี้ในคลัง — กลับไปเลือกชนิดอื่น' });
  }

  // Row 1: fixed qty buttons
  const row1 = new ActionRowBuilder().addComponents(
    QTY_OPTIONS.map(qty =>
      new ButtonBuilder()
        .setCustomId(`pet_act_${uid}_feedqty_${foodId}:${qty}`)
        .setLabel(`×${qty}  (+${(food?.exp || 0) * qty} EXP)`)
        .setStyle(qty === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(have < qty)
    )
  );

  // Row 2: feed all + back
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_feedqty_${foodId}:${have}`)
      .setLabel(`×ทั้งหมด (${have} ชิ้น  +${(food?.exp || 0) * have} EXP)`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(have === 0),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_feedmenu`)
      .setLabel('◀ กลับเลือกอาหาร')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
