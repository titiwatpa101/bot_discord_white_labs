const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const marketManager = require('../managers/marketManager');
const catalog       = require('../data/catalog.json');

const RARITY_LABEL = { legendary: '⭐', epic: '💜', rare: '🔷', uncommon: '🟢', common: '⚪' };

function buildMarketEmbed(guildId) {
  const listings = marketManager.getListings(guildId);
  const event    = marketManager.getActiveEvent(guildId);

  // Build price rows — group by species, show best (lowest) listing price
  const bySpecies = {};
  for (const l of listings) {
    if (!bySpecies[l.speciesId] || l.price < bySpecies[l.speciesId].price) {
      bySpecies[l.speciesId] = l;
    }
  }

  const rows = Object.entries(bySpecies).slice(0, 10).map(([sid, l]) => {
    const sp     = catalog[sid];
    const state  = marketManager.getMarketState(guildId, sid);
    const pctStr = (state.change >= 0 ? '+' : '') + (state.change * 100).toFixed(1) + '%';
    return `${RARITY_LABEL[sp?.rarity] || '⚪'} ${sp?.emoji || ''} **${sp?.name || sid}**  ${l.price.toLocaleString()}c  ${state.label}  (${pctStr})`;
  });

  const desc = rows.length
    ? rows.join('\n')
    : '*ยังไม่มี listing — ใช้ !pet เพื่อลงขาย*';

  const eventLine = event
    ? `\n\n🚨 **Event:** ${event.desc}  *(หมดใน <t:${Math.floor(event.expiresAt / 1000)}:R>)*`
    : '';

  const embed = new EmbedBuilder()
    .setTitle('📊 ตลาดสัตว์เลี้ยง')
    .setDescription(desc + eventLine)
    .setColor(0x5865f2)
    .setFooter({ text: `${listings.length} listing ทั้งหมด • อัปเดตล่าสุด` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pet_open_market')
      .setLabel('🛒 เปิด Panel เพื่อซื้อ/ขาย')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

async function updateMarketPanel(client, guildId) {
  try {
    const cfg = marketManager.getPanelConfig(guildId);
    if (!cfg.channelId || !cfg.messageId) return;
    const channel = client.channels.cache.get(cfg.channelId);
    if (!channel) return;
    const msg = await channel.messages.fetch(cfg.messageId).catch(() => null);
    if (!msg) return;
    const { embed, row } = buildMarketEmbed(guildId);
    await msg.edit({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[pet] updateMarketPanel error:', err.message);
  }
}

module.exports = { buildMarketEmbed, updateMarketPanel };
