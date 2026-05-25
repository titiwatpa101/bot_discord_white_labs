const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uno')
    .setDescription('🃏 สร้างห้องเกม UNO ใหม่ในเซิร์ฟเวอร์'),

  async execute(interaction) {
    await interaction.deferReply();

    const serverUrl = process.env.UNO_SERVER_URL || 'http://localhost:3001';
    const apiKey    = process.env.BOT_API_KEY;

    if (!apiKey) {
      return interaction.editReply('❌ ยังไม่ได้ตั้ง `BOT_API_KEY` ใน .env');
    }

    try {
      const res = await fetch(`${serverUrl}/api/rooms/create`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bot-key':    apiKey,
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Server ${res.status}: ${body}`);
      }

      const { roomId, url } = await res.json();

      await interaction.editReply({
        embeds: [{
          title:       '🃏 ห้องเกม UNO พร้อมแล้ว!',
          description: `กดลิงก์ด้านล่าง → Login ด้วย Discord → รอเพื่อนเข้าแล้วกด **เริ่มเกม**`,
          color:       0xe74c3c,
          fields: [
            { name: '🔗 ลิงก์เข้าห้อง',  value: url,    inline: false },
            { name: '🆔 Room ID',         value: `\`${roomId}\``, inline: true },
            { name: '👥 ผู้เล่น',         value: '2–4 คน', inline: true },
          ],
          footer: { text: `สร้างโดย ${interaction.user.username} · ห้องหายถ้า server ปิด` },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      console.error('[UNO] create room error:', err.message);
      await interaction.editReply(
        '❌ ไม่สามารถสร้างห้องได้ — ตรวจสอบว่า `uno-game/server` กำลังรันอยู่',
      );
    }
  },
};
