const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function build(ticketChannelId, ticketData) {
  const claimedStr = ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'ยังไม่มี';

  const desc =
    `**หัวข้อ:** ${ticketData.topic}\n` +
    `**เปิดโดย:** <@${ticketData.userId}>\n` +
    `**รับโดย:** ${claimedStr}` +
    (ticketData.description ? `\n\n**รายละเอียด:**\n${ticketData.description}` : '');

  const embed = new EmbedBuilder()
    .setTitle('🎫 Ticket Control Panel')
    .setDescription(desc)
    .setColor(0x5865f2)
    .setFooter({ text: `Ticket #${ticketData.counter}` })
    .setTimestamp(ticketData.openedAt ? new Date(ticketData.openedAt) : undefined);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tk_claim_${ticketChannelId}`)
      .setLabel(ticketData.claimedBy ? '✅ Claimed' : '👤 Claim')
      .setStyle(ticketData.claimedBy ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!!ticketData.claimedBy),
    new ButtonBuilder()
      .setCustomId(`tk_adduser_${ticketChannelId}`)
      .setLabel('➕ Add User')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tk_rename_${ticketChannelId}`)
      .setLabel('✏️ Rename')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tk_close_${ticketChannelId}`)
      .setLabel('🔒 Close')
      .setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { build };
