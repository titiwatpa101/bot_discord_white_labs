const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR } = require('./constants');
const { encodeState } = require('./enhanceMatPanel');
const catalog = require('../data/catalog.json');

function build(userId, user, pet, result) {
  const uid = userId;
  const sp  = catalog[pet.speciesId];

  const emptyState = encodeState(pet.instanceId, { c: 0, u: 0, r: 0, e: 0, l: 0 }, false, 0);

  let title, color, desc;

  if (result.reason === 'maxLevel') {
    title = '⚠️ ระดับสูงสุดแล้ว';
    color = 0x888888;
    desc  = `${sp?.emoji || ''} **${sp?.name}** อยู่ที่ **+10** แล้ว ไม่สามารถตีบวกได้อีก`;
  } else if (result.success) {
    title = '✨ ตีติด!';
    color = 0x57f287;
    desc  =
      `${sp?.emoji || ''} **${sp?.name}** เลื่อนขึ้นสำเร็จ!\n\n` +
      `**+${result.newLevel - 1}  →  +${result.newLevel}** 🎉\n\n` +
      `Rate: ${(result.rate * 100).toFixed(1)}%  |  Roll: ${(result.roll * 100).toFixed(1)}%`;
  } else if (result.protected) {
    title = '🛡️ ป้องกันสำเร็จ!';
    color = 0xfee75c;
    desc  =
      `${sp?.emoji || ''} **${sp?.name}** ตีไม่ติด แต่บัตรป้องกันทำงาน!\n\n` +
      `ระดับยังคงอยู่ที่ **+${result.newLevel}**\n` +
      `Rate: ${(result.rate * 100).toFixed(1)}%  |  Roll: ${(result.roll * 100).toFixed(1)}%\n\n` +
      `Pity สะสมเพิ่ม — โอกาสครั้งถัดไปสูงขึ้น`;
  } else {
    // Failed + level dropped
    const dropped = result.dropped || 0;
    title = dropped > 0 ? '💥 ตีแตก!' : '❌ ตีไม่ติด';
    color = 0xed4245;
    desc  =
      `${sp?.emoji || ''} **${sp?.name}** ตีไม่ติด...\n\n` +
      (dropped > 0
        ? `ระดับลดลง **${dropped}** ขั้น → **+${result.newLevel}**\n`
        : `ระดับยังคงอยู่ที่ **+${result.newLevel}**\n`) +
      `Rate: ${(result.rate * 100).toFixed(1)}%  |  Roll: ${(result.roll * 100).toFixed(1)}%\n\n` +
      `Pity สะสมเพิ่ม — โอกาสครั้งถัดไปสูงขึ้น`;
  }

  // Show current pity for next attempt
  const target   = (pet.enhanceLevel || 0) + 1;
  const newPity  = ((pet.pityStack || {})[String(target)]) || 0;
  if (newPity > 0 && !result.success) {
    desc += `\n🔥 Pity ระดับ +${target}: **${newPity} ครั้ง**`;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp();

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pet_act_${uid}_emat_${emptyState}`)
      .setLabel('⚔️ ตีอีกครั้ง')
      .setStyle(ButtonStyle.Primary)
      .setDisabled((pet.enhanceLevel || 0) >= 10),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_enhance`)
      .setLabel('🔄 เลือกสัตว์ใหม่')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`pet_nav_${uid}_main`)
      .setLabel('🏠 หน้าหลัก')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { build };
