const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { RARITY_BADGE, RARITY_LABEL } = require('./constants');
const catalog          = require('../data/catalog.json');
const wtManager        = require('../managers/wonderTradeManager');

function build(userId, guildId, user) {
  const uid  = userId;
  const pool = wtManager.getPool(guildId);
  const userInPool = pool.find(e => e.userId === userId);

  const poolLines = pool.length
    ? pool.map((e, i) =>
        `**${i + 1}.** ${e.emoji} **${e.name}**  ${RARITY_BADGE[e.rarity] || '⚪'}  Lv.${e.level}` +
        (e.userId === userId ? '  ← *ของคุณ*' : '')
      ).join('\n')
    : '*พูลว่างอยู่*';

  const embed = new EmbedBuilder()
    .setTitle('🔀 Wonder Trade')
    .setDescription(
      `**${pool.length} ตัว**รอการแลกเปลี่ยน\n\n${poolLines}\n\n` +
      (userInPool
        ? `✅ สัตว์ของคุณอยู่ในพูลแล้ว\n*กด "ถอน" เพื่อยกเลิก หรือรอให้มีคนมาแลก*`
        : `เลือกสัตว์เพื่อส่งเข้าพูล — จะได้รับสัตว์สุ่มกลับมา`)
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Wonder Trade — ไม่รู้ว่าจะได้อะไร!' });

  const components = [];

  if (userInPool) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`pet_act_${uid}_withdraw`)
          .setLabel('❌ ถอนสัตว์ออกจากพูล')
          .setStyle(ButtonStyle.Danger),
      )
    );
  } else if (user.pets.length) {
    const options = user.pets.slice(0, 25).map(p => {
      const sp = catalog[p.speciesId];
      return {
        label:       `${sp?.name || p.speciesId}  Lv.${p.level}`,
        description: `${RARITY_BADGE[sp?.rarity] || ''} ${sp?.rarity?.toUpperCase() || ''}`,
        value:       p.instanceId,
        emoji:       sp?.emoji || '🐾',
      };
    });

    components.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`petsel_trade_${uid}`)
          .setPlaceholder('เลือกสัตว์เพื่อส่งเข้าพูล...')
          .addOptions(options)
      )
    );
  }

  components.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pet_nav_${uid}_main`).setLabel('◀ กลับ').setStyle(ButtonStyle.Secondary)
    )
  );

  return { embeds: [embed], components };
}

module.exports = { build };
