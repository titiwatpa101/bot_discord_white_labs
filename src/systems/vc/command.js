const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('ระบบห้อง Voice อัตโนมัติ')

    // ── /vc setup ──
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('[Admin] เพิ่มห้อง "สร้างห้อง" — ใครเข้ามาบอทสร้างห้องให้อัตโนมัติ')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('เลือก voice channel ที่จะทำหน้าที่เป็น "สร้างห้อง"')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )

    // ── /vc remove ──
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('[Admin] ลบห้อง "สร้างห้อง" ออกจากระบบ')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('เลือก voice channel ที่ต้องการลบออก')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )

    // ── /vc list ──
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('[Admin] ดูรายการห้อง "สร้างห้อง" ทั้งหมดที่ตั้งค่าไว้')
    )

    // ── /vc panel ──
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('เปิด Control Panel ของห้องคุณใหม่ (ถ้าแชทจม)')
    ),
};
