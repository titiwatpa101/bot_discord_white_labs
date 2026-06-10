const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const wtManager = require('../managers/wonderTradeManager');

const RARITY_LABEL = { legendary: '⭐', epic: '💜', rare: '🔷', uncommon: '🟢', common: '⚪' };

function buildWonderTradeEmbed(guildId) {
  const pool = wtManager.getPool(guildId);

  const lines = pool.length
    ? pool.map((e, i) =>
        `**${i + 1}.** ${e.emoji} ${e.name}  ${RARITY_LABEL[e.rarity] || '⚪'}  Lv.${e.level}  — <@${e.userId}>`
      ).join('\n')
    : '*ยังไม่มีสัตว์ในพูล*';

  const embed = new EmbedBuilder()
    .setTitle('🔀 Wonder Trade Pool')
    .setDescription(
      `**${pool.length} ตัว**รอการแลก\n\n${lines}`
    )
    .setColor(0x5865f2)
    .setFooter({ text: `อัปเดตล่าสุด` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pet_open_trade')
      .setLabel('🔀 เปิด Panel เพื่อ Trade')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

async function updateWonderTradePanel(client, guildId) {
  try {
    const cfg = wtManager.getPanelConfig(guildId);
    if (!cfg.channelId || !cfg.messageId) return;
    const channel = client.channels.cache.get(cfg.channelId);
    if (!channel) return;
    const msg = await channel.messages.fetch(cfg.messageId).catch(() => null);
    if (!msg) return;
    const { embed, row } = buildWonderTradeEmbed(guildId);
    await msg.edit({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[pet] updateWonderTradePanel error:', err.message);
  }
}

module.exports = { buildWonderTradeEmbed, updateWonderTradePanel };
