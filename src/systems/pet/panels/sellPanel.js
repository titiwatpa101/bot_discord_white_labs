const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_LABEL } = require('./constants');
const catalog           = require('../data/catalog.json');
const marketManager     = require('../managers/marketManager');

function build(userId, guildId, user, instanceId) {
  const uid = userId;
  const pet = user.pets.find(p => p.instanceId === instanceId);
  const sp  = pet ? catalog[pet.speciesId] : null;

  if (!pet || !sp) {
    return {
      embeds: [new EmbedBuilder().setDescription('❌ ไม่พบสัตว์').setColor(0xed4245)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      )]
    };
  }

  const enh         = pet.enhanceLevel || 0;
  const marketPrice = marketManager.getCurrentPrice(guildId, pet.speciesId, enh);
  const state       = marketManager.getMarketState(guildId, pet.speciesId);
  const enhLabel    = enh > 0 ? ` **+${enh}**` : '';

  // Offer 5 price tiers around market price
  const tiers = [0.6, 0.8, 1.0, 1.2, 1.5].map(mult => Math.round(marketPrice * mult));

  const options = tiers.map(p => ({
    label:       `${p.toLocaleString()} coins`,
    description: p === Math.round(marketPrice) ? '≈ ราคาตลาด' : p < marketPrice ? 'ต่ำกว่าตลาด (ขายเร็ว)' : 'สูงกว่าตลาด (ขายช้า)',
    value:       `${instanceId}__${p}`,
  }));

  const embed = new EmbedBuilder()
    .setTitle(`💰 ลงขาย ${sp.emoji} ${sp.name}${enhLabel}`)
    .setDescription(
      `${RARITY_LABEL[sp.rarity]}  •  Lv.**${pet.level}**${enhLabel}\n\n` +
      `ราคาตลาดปัจจุบัน: **${marketPrice.toLocaleString()} coins**  ${state.label}\n\n` +
      `เลือกราคาที่ต้องการตั้ง:`
    )
    .setColor(0xed4245);

  const row1 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`petsel_sellprice_${uid}`)
      .setPlaceholder('เลือกราคา...')
      .addOptions(options)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_detail_${instanceId}`)
      .setLabel('◀ กลับ')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
