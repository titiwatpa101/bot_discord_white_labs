const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PULL_1_COST, PULL_11_COST, PITY_LIMIT } = require('../managers/gachaManager');

function pityBar(pity, width = 20) {
  const filled  = Math.round((pity / PITY_LIMIT) * width);
  const clamped = Math.min(width, Math.max(0, filled));
  return '█'.repeat(clamped) + '░'.repeat(width - clamped);
}

function build(userId, user) {
  const coins = user.coins || 0;
  const pity  = user.gachaPity || 0;

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
      '```'
    )
    .addFields(
      { name: '💰 เงิน', value: `**${coins.toLocaleString()}** coins`, inline: true },
      { name: `🎯 Pity — ${pity}/${PITY_LIMIT}`, value: `\`${pityBar(pity)}\`\n${PITY_LIMIT - pity} ครั้งถึงการันตี ⭐`, inline: false },
    )
    .setFooter({ text: '200 ครั้งไม่ได้ Legendary = การันตี 1 ตัว!' });

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
