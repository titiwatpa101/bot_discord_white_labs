const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function build(channelId, panelConfig) {
  const topics = panelConfig.topics || [];
  const topicList = topics.length
    ? topics.map(t => `• ${t}`).join('\n') + '\n• ➕ อื่นๆ (กำหนดเอง)'
    : '• 🐛 รายงานบัก\n• 💰 ปัญหาการชำระเงิน\n• ❓ สอบถามทั่วไป\n• ➕ อื่นๆ (กำหนดเอง)';

  const embed = new EmbedBuilder()
    .setTitle('🎫 สร้าง Ticket')
    .setDescription(
      'กดปุ่มด้านล่างเพื่อสร้าง ticket และรับความช่วยเหลือจากทีมงาน\n\n' +
      `**หัวข้อที่รองรับ:**\n${topicList}`
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'ระบบจะสร้างห้อง ticket ส่วนตัวให้คุณโดยอัตโนมัติ' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tk_create_${channelId}`)
      .setLabel('🎫 สร้าง Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { build };
