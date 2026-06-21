const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR, RARITY_BADGE } = require('./constants');
const catalog           = require('../data/catalog.json');
const { expBar, expToNext, totalFood } = require('../managers/petManager');
const { dropRateLabel } = require('../managers/coinDropManager');
const { enhanceLevelLabel } = require('../managers/enhanceManager');

function build(userId, user) {
  const active  = user.pets[0];
  const sp      = active ? catalog[active.speciesId] : null;
  const uid     = userId;

  let activeField = '*ยังไม่มีสัตว์ — รอ spawn หรือ Wonder Trade*';
  if (active && sp) {
    const bar      = expBar(active.exp, active.level);
    const needed   = expToNext(active.level);
    const enh      = enhanceLevelLabel(active.enhanceLevel);
    activeField    =
      `${sp.emoji} **${sp.name}**${enh}  ${RARITY_LABEL[sp.rarity]}\n` +
      `Lv.**${active.level}**  \`${bar}\`  ${active.exp}/${needed} EXP`;
  }

  const rarityCount = {};
  for (const p of user.pets) {
    const r = catalog[p.speciesId]?.rarity || 'common';
    rarityCount[r] = (rarityCount[r] || 0) + 1;
  }
  const countLine = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
    .filter(r => rarityCount[r])
    .map(r => `${RARITY_BADGE[r]}×${rarityCount[r]}`)
    .join('  ') || '0';

  const embed = new EmbedBuilder()
    .setTitle('🐾 แผงควบคุมสัตว์เลี้ยง')
    .setColor(sp ? (RARITY_COLOR[sp.rarity] || 0x5865f2) : 0x5865f2)
    .addFields(
      { name: '💰 Wallet',    value: `**${(user.coins || 0).toLocaleString()}** coins`, inline: true },
      { name: '🐾 สัตว์',    value: `**${user.pets.length}** ตัว  ${countLine}`, inline: true },
      { name: '🍖 อาหาร',   value: `**${totalFood(user)}** ชิ้น`, inline: true },
      { name: '🪙 รายได้ passive', value: dropRateLabel(user), inline: false },
      { name: '⭐ Active Pet', value: activeField },
    )
    .setTimestamp();

  if (active && sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('📦 คลังสัตว์').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`pet_act_${uid}_feedmenu`).setLabel('🍖 ให้อาหาร').setStyle(ButtonStyle.Success).setDisabled(!active),
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_shop`).setLabel('🏪 ร้านค้า').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_market`).setLabel('📊 ตลาด').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_trade`).setLabel('🔀 Wonder Trade').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_enhance`).setLabel('⚔️ ตีบวก').setStyle(ButtonStyle.Danger).setDisabled(!active),
  );

  const hasLeg8 = user.pets.some(p => {
    const s = catalog[p.speciesId];
    return s?.rarity === 'legendary' && (p.enhanceLevel || 0) >= 8;
  });

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pet_nav_${uid}_mythic`).setLabel('🔱 Mythic Fusion').setStyle(ButtonStyle.Danger).setDisabled(!hasLeg8),
  );

  return { embeds: [embed], components: [row1, row2, row3] };
}

module.exports = { build };
