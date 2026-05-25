const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

// ─── Permission helpers ───────────────────────────────────────────────────────

function isLocked(channel) {
  const overwrite = channel.permissionOverwrites.cache.get(channel.guildId);
  return overwrite?.deny.has(PermissionFlagsBits.Connect) ?? false;
}

function isHidden(channel) {
  const overwrite = channel.permissionOverwrites.cache.get(channel.guildId);
  return overwrite?.deny.has(PermissionFlagsBits.ViewChannel) ?? false;
}

// ─── Panel Builder ────────────────────────────────────────────────────────────

function buildVcPanel(channel, ownerId) {
  const locked = isLocked(channel);
  const hidden = isHidden(channel);

  const embed = {
    title: '🎙️ VC Control Panel',
    description: `เจ้าของห้อง: <@${ownerId}>`,   // mention render ได้ใน description
    color: locked ? 0xed4245 : hidden ? 0x99aab5 : 0x5865f2,
    fields: [
      {
        name: '🔒 ล็อก',
        value: locked ? '🔴 ล็อกอยู่ — คนอื่นเข้าไม่ได้' : '🟢 เปิดอยู่',
        inline: true,
      },
      {
        name: '👁️ การมองเห็น',
        value: hidden ? '🙈 ซ่อนอยู่ — คนอื่นมองไม่เห็น' : '👁️ มองเห็นได้',
        inline: true,
      },
      {
        name: '👥 จำกัดคน',
        value: channel.userLimit > 0 ? `**${channel.userLimit}** คน` : 'ไม่จำกัด',
        inline: true,
      },
    ],
    footer: { text: 'เฉพาะเจ้าของห้องเท่านั้นที่ใช้ปุ่มได้' },
    timestamp: new Date().toISOString(),
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vc_toggle_lock')
      .setLabel(locked ? 'Unlock' : 'Lock')
      .setEmoji(locked ? '🔓' : '🔒')
      .setStyle(locked ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('vc_toggle_hide')
      .setLabel(hidden ? 'Show' : 'Hide')
      .setEmoji(hidden ? '👁️' : '🙈')
      .setStyle(hidden ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_limit')
      .setLabel('Limit')
      .setEmoji('🔢')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_rename')
      .setLabel('Rename')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('vc_kick')
      .setLabel('Kick')
      .setEmoji('👢')
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { buildVcPanel, isLocked, isHidden };
