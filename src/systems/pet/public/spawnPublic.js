const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const RARITY_COLOR = { legendary: 0xf1c40f, epic: 0x9b59b6, rare: 0x3498db, uncommon: 0x2ecc71, common: 0x95a5a6 };
const RARITY_LABEL = { legendary: '⭐ LEGENDARY', epic: '💜 EPIC', rare: '🔷 RARE', uncommon: '🟢 UNCOMMON', common: '⚪ COMMON' };

function buildSpawnEmbed(guildId, channelId, speciesId, species, marketPrice) {
  const embed = new EmbedBuilder()
    .setTitle(`🌟 สัตว์ปรากฏ!`)
    .setDescription(
      `## ${species.emoji} ${species.name}\n` +
      `${RARITY_LABEL[species.rarity]}  •  ราคาตลาด: **${marketPrice.toLocaleString()} coins**\n\n` +
      `⏱️ หมดเวลาใน **5 นาที** — คนแรกที่กดได้สิทธิ์!`
    )
    .setColor(RARITY_COLOR[species.rarity] || 0x5865f2)
    .setTimestamp();

  if (species.imageUrl) embed.setImage(species.imageUrl);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_spawn_${guildId}_${channelId}`)
      .setLabel('🐾 จับเลย!')
      .setStyle(ButtonStyle.Success)
  );

  return { embed, row };
}

function buildSpawnExpiredEmbed(species) {
  return new EmbedBuilder()
    .setTitle(`💨 สัตว์หนีไปแล้ว`)
    .setDescription(`${species.emoji} **${species.name}** หนีหายไปก่อนที่ใครจะจับได้...`)
    .setColor(0x36393f)
    .setTimestamp();
}

module.exports = { buildSpawnEmbed, buildSpawnExpiredEmbed };
