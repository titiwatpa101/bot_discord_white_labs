const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RARITY_COLOR, RARITY_LABEL } = require('./constants');
const catalog = require('../data/catalog.json');
const { expBar, expToNext } = require('../managers/petManager');

function build(userId, user, instanceId) {
  const uid  = userId;
  const pet  = user.pets.find(p => p.instanceId === instanceId);

  if (!pet) {
    return {
      embeds: [new EmbedBuilder().setDescription('❌ ไม่พบสัตว์ตัวนี้').setColor(0xed4245)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`pet_nav_${uid}_pets`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
        )
      ],
    };
  }

  const sp      = catalog[pet.speciesId];
  const isActive = user.pets[0]?.instanceId === instanceId;
  const bar     = expBar(pet.exp, pet.level);
  const needed  = expToNext(pet.level);
  const hasFood = Object.values(user.food).some(n => n > 0);

  const { RARITY_BASE } = require('../managers/coinDropManager');
  const rBase      = RARITY_BASE[sp?.rarity] || 1;
  const dropPerSlot = Math.floor(rBase * Math.sqrt(pet.level) * (isActive ? 1.5 : 1.0));

  const embed = new EmbedBuilder()
    .setTitle(`${sp?.emoji || '🐾'} ${sp?.name || pet.speciesId}`)
    .setColor(RARITY_COLOR[sp?.rarity] || 0x5865f2)
    .addFields(
      { name: 'Rarity', value: RARITY_LABEL[sp?.rarity] || '-', inline: true },
      { name: 'Level',  value: `${pet.level}`, inline: true },
      { name: 'Slot',   value: isActive ? '#1 ✅ Active' : `#${user.pets.findIndex(p => p.instanceId === instanceId) + 1}`, inline: true },
      { name: `EXP  \`${bar}\``, value: `${pet.exp} / ${needed}` },
      { name: '🪙 Passive Income', value: `+${dropPerSlot} coins / 5 นาที${isActive ? '  *(Active ×1.5)*' : ''}`, inline: true },
    );

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_setactive_${instanceId}`)
      .setLabel('⭐ Set Active')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isActive),
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_feedmenu`)
      .setLabel('🍖 ให้อาหาร')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!hasFood),
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_sell_${instanceId}`)
      .setLabel('💰 ลงขาย')
      .setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_tradesubmit_${instanceId}`)
      .setLabel('🔀 Wonder Trade')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_pets`)
      .setLabel('◀ กลับ')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row1, row2] };
}

module.exports = { build };
