const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR } = require('./constants');
const catalog = require('../data/catalog.json');

function build(userId, user) {
  const uid = userId;

  const eligible = user.pets.filter(p => {
    const sp = catalog[p.speciesId];
    return sp?.rarity === 'legendary' && (p.enhanceLevel || 0) >= 8;
  });

  const embed = new EmbedBuilder()
    .setTitle('🔱 Mythic Fusion')
    .setColor(RARITY_COLOR.mythic)
    .setDescription(
      '**เงื่อนไข:** ใช้ Legendary +8 ขึ้นไป 5 ตัว → สุ่มได้ Mythic 1 ตัว\n\n' +
      (eligible.length < 5
        ? `❌ คุณมี Legendary +8↑ เพียง **${eligible.length}/5** ตัว — ยังไม่สามารถ Fusion ได้`
        : `✅ มี Legendary +8↑ **${eligible.length}** ตัว — เลือก 5 ตัวเพื่อ Fusion`)
    );

  if (eligible.length < 5) {
    if (eligible.length > 0) {
      const list = eligible.map(p => {
        const sp = catalog[p.speciesId];
        return `${sp?.emoji || '🐾'} **${sp?.name}** +${p.enhanceLevel}`;
      }).join('\n');
      embed.addFields({ name: 'Legendary +8↑ ที่มี', value: list });
    }

    return {
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
        ),
      ],
    };
  }

  const options = eligible.slice(0, 25).map(p => {
    const sp = catalog[p.speciesId];
    return {
      label:       `${sp?.emoji || ''} ${sp?.name || p.speciesId} +${p.enhanceLevel}`,
      description: `Lv.${p.level}  ${RARITY_LABEL.legendary}`,
      value:       p.instanceId,
    };
  });

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_mythic_${uid}`)
          .setPlaceholder('เลือก Legendary 5 ตัว...')
          .setMinValues(5)
          .setMaxValues(5)
          .addOptions(options)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
      ),
    ],
  };
}

function buildConfirm(userId, selectedPets) {
  const uid = userId;
  const lines = selectedPets.map((p, i) => {
    const sp = catalog[p.speciesId];
    return `${i + 1}. ${sp?.emoji || '🐾'} **${sp?.name}** +${p.enhanceLevel}  Lv.${p.level}`;
  });

  const mythicList = Object.entries(catalog)
    .filter(([, sp]) => sp.rarity === 'mythic')
    .map(([, sp]) => `${sp.emoji} ${sp.name}`)
    .join('、');

  const embed = new EmbedBuilder()
    .setTitle('🔱 ยืนยัน Mythic Fusion')
    .setColor(RARITY_COLOR.mythic)
    .setDescription(
      '**สัตว์ที่จะใช้ (จะหายไป):**\n' +
      lines.join('\n') +
      '\n\n⚠️ **สัตว์ทั้ง 5 ตัวจะถูกลบถาวร**\n' +
      `🔱 สุ่มได้: ${mythicList}`
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pet_act_${uid}_mythicgo`).setLabel('🔱 Fusion!').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`pet_nav_${uid}_mythic`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

function buildResult(speciesId) {
  const sp    = catalog[speciesId];
  const embed = new EmbedBuilder()
    .setTitle('🔱 Mythic Fusion สำเร็จ!')
    .setDescription(`${sp?.emoji || '🐾'} **${sp?.name}**\n${RARITY_LABEL.mythic}`)
    .setColor(RARITY_COLOR.mythic);

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  return embed;
}

module.exports = { build, buildConfirm, buildResult };
