const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RARITY_LABEL } = require('./constants');
const catalog           = require('../data/catalog.json');
const { expBar, expToNext, totalFood } = require('../managers/petManager');

function build(userId, user) {
  const active  = user.pets[0];
  const sp      = active ? catalog[active.speciesId] : null;
  const uid     = userId;

  let activeField = '*ยังไม่มีสัตว์ — รอ spawn หรือ Wonder Trade*';
  if (active && sp) {
    const bar      = expBar(active.exp, active.level);
    const needed   = expToNext(active.level);
    activeField    =
      `${sp.emoji} **${sp.name}**  ${RARITY_LABEL[sp.rarity]}\n` +
      `Lv.**${active.level}**  \`${bar}\`  ${active.exp}/${needed} EXP`;
  }

  const embed = new EmbedBuilder()
    .setTitle('🐾 แผงควบคุมสัตว์เลี้ยง')
    .setColor(0x5865f2)
    .addFields(
      { name: '💰 Wallet', value: `${(user.coins || 0).toLocaleString()} coins`, inline: true },
      { name: '🐾 สัตว์', value: `${user.pets.length} ตัว`, inline: true },
      { name: '🍖 อาหาร', value: `${totalFood(user)} ชิ้น`, inline: true },
      { name: 'Active Pet', value: activeField },
    )
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('📦 คลังสัตว์').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`pet_act_${uid}_feedmenu`).setLabel('🍖 ให้อาหาร').setStyle(ButtonStyle.Success).setDisabled(!active),
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_shop`).setLabel('🏪 ร้านค้า').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_market`).setLabel('📊 ตลาด').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_trade`).setLabel('🔀 Wonder Trade').setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
