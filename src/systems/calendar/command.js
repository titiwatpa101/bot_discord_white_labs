const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calendar')
    .setDescription('ระบบปฏิทินจอง')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s =>
      s.setName('setup')
        .setDescription('ส่ง + ปักหมุด calendar panel ในช่อง')
        .addChannelOption(o =>
          o.setName('channel').setDescription('ช่องที่จะส่ง panel').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('roles').setDescription('Role(s) ที่ใช้ calendar ได้ เช่น @Member @VIP (ไม่ใส่ = ทุกคน)')
        )
    )

    .addSubcommand(s =>
      s.setName('roles')
        .setDescription('แก้ไข role ที่ใช้ calendar ได้ (ไม่ต้อง setup ใหม่)')
        .addStringOption(o =>
          o.setName('roles').setDescription('Role(s) ที่ใช้ calendar ได้ เช่น @Member @VIP (ไม่ใส่ = ทุกคน)')
        )
    )

    .addSubcommand(s =>
      s.setName('remove')
        .setDescription('ลบ calendar panel ออกจากช่อง')
    ),
};
