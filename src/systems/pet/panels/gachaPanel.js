const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PULL_1_COST, PULL_11_COST } = require('../managers/gachaManager');

function build(userId, user) {
  const coins = user.coins || 0;

  const embed = new EmbedBuilder()
    .setTitle('🎰 Gacha — สุ่มสัตว์เลี้ยง')
    .setDescription(
      '**อัตราการออก:**\n' +
      '⚪ Common  50%\n' +
      '🟢 Uncommon  25%\n' +
      '🔷 Rare  15%\n' +
      '💜 Epic  7%\n' +
      '⭐ Legendary  2.5%\n' +
      '✨ Gacha-Exclusive  0.5%\n\n' +
      `💰 เงินของคุณ: **${coins.toLocaleString()}** coins`
    )
    .setColor(0xff6b35)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`gc_pull1_${userId}`)
      .setLabel(`🎲 สุ่ม 1 ตัว (${PULL_1_COST.toLocaleString()})`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(coins < PULL_1_COST),
    new ButtonBuilder()
      .setCustomId(`gc_pull11_${userId}`)
      .setLabel(`🎲 สุ่ม 11 ตัว (${PULL_11_COST.toLocaleString()})`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(coins < PULL_11_COST),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { build };
