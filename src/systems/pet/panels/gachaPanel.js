const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PULL_1_COST, PULL_11_COST } = require('../managers/gachaManager');

function build(userId, user) {
  const coins = user.coins || 0;

  const embed = new EmbedBuilder()
    .setTitle('🎰 Gacha — สุ่มสัตว์เลี้ยง')
    .setColor(0xff6b35)
    .setDescription(
      '```\n' +
      '┌──────────────────────────┐\n' +
      '│    ✦ อัตราการออก ✦       │\n' +
      '├──────────────┬───────────┤\n' +
      '│ ⚪ Common     │  52%      │\n' +
      '│ 🟢 Uncommon   │  27%      │\n' +
      '│ 🔷 Rare       │  13%      │\n' +
      '│ 💜 Epic       │  7.625%   │\n' +
      '│ ⭐ Legendary  │  0.25%    │\n' +
      '│ ✨ Exclusive  │  0.125%   │\n' +
      '└──────────────┴───────────┘\n' +
      '```\n' +
      `💰 **${coins.toLocaleString()}** coins`
    )
    .setFooter({ text: 'Gacha-Exclusive Legendary ได้จากที่นี่เท่านั้น!' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`gc_pull1_${userId}`)
      .setLabel(`🎲 สุ่ม ×1 — ${PULL_1_COST.toLocaleString()}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(coins < PULL_1_COST),
    new ButtonBuilder()
      .setCustomId(`gc_pull11_${userId}`)
      .setLabel(`🎲 สุ่ม ×11 — ${PULL_11_COST.toLocaleString()}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(coins < PULL_11_COST),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { build };
