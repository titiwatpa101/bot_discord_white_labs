const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_BADGE } = require('./constants');
const catalog           = require('../data/catalog.json');

function build(userId, user) {
  const uid = userId;

  const embed = new EmbedBuilder()
    .setTitle('📦 คลังสัตว์เลี้ยง')
    .setDescription(
      user.pets.length
        ? 'เลือกสัตว์เพื่อดูรายละเอียดและจัดการ'
        : '*ยังไม่มีสัตว์ — รอ spawn หรือ Wonder Trade*'
    )
    .setColor(0x5865f2)
    .setFooter({ text: `${user.pets.length} ตัว` });

  const components = [];

  if (user.pets.length) {
    const options = user.pets.slice(0, 25).map((p, i) => {
      const sp    = catalog[p.speciesId];
      const badge = RARITY_BADGE[sp?.rarity] || '⚪';
      return {
        label:       `${i === 0 ? '★ ' : ''}${sp?.name || p.speciesId}  Lv.${p.level}`,
        description: `${badge} ${sp?.rarity?.toUpperCase() || ''}  •  EXP ${p.exp}/${Math.floor(100 * Math.pow(p.level, 1.5))}`,
        value:       p.instanceId,
        emoji:       sp?.emoji || '🐾',
      };
    });

    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_pet_${uid}`)
          .setPlaceholder('เลือกสัตว์...')
          .addOptions(options)
      )
    );
  }

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
    )
  );

  return { embeds: [embed], components };
}

module.exports = { build };
