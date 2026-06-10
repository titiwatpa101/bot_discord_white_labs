const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_BADGE } = require('./constants');
const catalog           = require('../data/catalog.json');
const marketManager     = require('../managers/marketManager');

function build(userId, guildId, user) {
  const uid      = userId;
  const listings = marketManager.getListings(guildId);
  const event    = marketManager.getActiveEvent(guildId);
  const coins    = user.coins || 0;

  const othersListings = listings.filter(l => l.userId !== userId).slice(0, 25);

  const lines = listings.slice(0, 10).map(l => {
    const sp    = catalog[l.speciesId];
    const state = marketManager.getMarketState(guildId, l.speciesId);
    const mine  = l.userId === userId ? ' *(ของคุณ)*' : '';
    return `${RARITY_BADGE[sp?.rarity] || '⚪'} ${sp?.emoji || ''} **${sp?.name || l.speciesId}**  ${l.price.toLocaleString()}c  ${state.label}${mine}`;
  });

  let desc = lines.length ? lines.join('\n') : '*ยังไม่มี listing*';
  if (event) desc += `\n\n🚨 **Event:** ${event.desc}`;

  const embed = new EmbedBuilder()
    .setTitle('📊 ตลาดสัตว์เลี้ยง')
    .setDescription(desc)
    .setColor(0x5865f2)
    .setFooter({ text: `💰 ${coins.toLocaleString()} coins • ${listings.length} listing` });

  const components = [];

  if (othersListings.length) {
    const options = othersListings.map(l => {
      const sp = catalog[l.speciesId];
      return {
        label:       `${sp?.name || l.speciesId}  ${l.price.toLocaleString()} coins`,
        description: `${RARITY_BADGE[sp?.rarity] || ''} ${sp?.rarity?.toUpperCase() || ''}  ขายโดย @${l.username}`,
        value:       l.listingId,
        emoji:       sp?.emoji || '🐾',
      };
    });

    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_market_${uid}`)
          .setPlaceholder('เลือก listing เพื่อซื้อ...')
          .addOptions(options)
      )
    );
  }

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('📤 เลือกสัตว์ลงขาย').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
    )
  );

  return { embeds: [embed], components };
}

module.exports = { build };
