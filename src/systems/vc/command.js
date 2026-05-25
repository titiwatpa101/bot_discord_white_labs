const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('ระบบห้อง Voice อัตโนมัติ')
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('[Admin] ตั้งค่าห้อง "➕ สร้างห้อง" — ใครเข้ามาบอทสร้างห้องให้อัตโนมัติ')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('เลือก voice channel ที่จะทำหน้าที่เป็น "สร้างห้อง"')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('เปิด Control Panel ของห้องคุณใหม่ (ถ้าแชทจม)')
    ),
};
