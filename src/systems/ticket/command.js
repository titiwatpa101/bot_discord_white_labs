const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('ระบบ Ticket — สร้างและจัดการ ticket support')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // /ticket global — ตั้งค่าส่วนกลาง (ทำครั้งเดียวต่อ server)
    .addSubcommand(s =>
      s.setName('global')
        .setDescription('ตั้งค่าส่วนกลาง: admin role(s) และ log channel')
        .addStringOption(o =>
          o.setName('adminroles').setDescription('Role(s) ที่จัดการ ticket ได้ เช่น @Admin @Mod').setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('logchannel').setDescription('Channel สำหรับ log การเปิด/ปิด ticket (optional)')
        )
    )

    // /ticket add — เพิ่ม panel ในช่องที่ต้องการ
    .addSubcommand(s =>
      s.setName('add')
        .setDescription('เพิ่ม ticket panel ในช่อง (ส่ง + ปักหมุด ปุ่มสร้าง ticket)')
        .addChannelOption(o =>
          o.setName('channel').setDescription('ช่องที่จะส่ง ticket panel').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('roles').setDescription('Role(s) ที่สร้าง ticket ได้ เช่น @role1 @role2').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('topics').setDescription('หัวข้อ คั่นด้วยจุลภาค เช่น 🐛รายงานบัก,❓ทั่วไป (optional)')
        )
        .addStringOption(o =>
          o.setName('category').setDescription('ชื่อหรือ ID category ที่จะสร้าง ticket ใน (optional)')
        )
    )

    // /ticket remove — ลบ panel
    .addSubcommand(s =>
      s.setName('remove')
        .setDescription('ลบ ticket panel ออกจากช่อง')
        .addChannelOption(o =>
          o.setName('channel').setDescription('ช่องที่มี panel').setRequired(true)
        )
    ),
};
