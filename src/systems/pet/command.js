const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('ระบบสัตว์เลี้ยง — Admin setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // /pet spawn setup
    .addSubcommandGroup(g =>
      g.setName('spawn').setDescription('ตั้งค่าระบบ spawn')
        .addSubcommand(s =>
          s.setName('setup')
            .setDescription('เพิ่มช่องสำหรับ spawn สัตว์')
            .addChannelOption(o => o.setName('channel').setDescription('ช่อง spawn').setRequired(true))
            .addIntegerOption(o => o.setName('interval').setDescription('ความถี่ (นาที) default: 30').setMinValue(5).setMaxValue(1440))
        )
        .addSubcommand(s =>
          s.setName('remove')
            .setDescription('ลบช่อง spawn')
            .addChannelOption(o => o.setName('channel').setDescription('ช่องที่ต้องการลบ').setRequired(true))
        )
        .addSubcommand(s => s.setName('trigger').setDescription('บังคับ spawn ทันที (ทดสอบ)'))
    )

    // /pet market setup
    .addSubcommandGroup(g =>
      g.setName('market').setDescription('ตั้งค่า public market panel')
        .addSubcommand(s =>
          s.setName('setup')
            .setDescription('ส่ง public market panel ไปยังช่อง')
            .addChannelOption(o => o.setName('channel').setDescription('ช่องสำหรับ market panel').setRequired(true))
        )
    )

    // /pet wondertrade setup
    .addSubcommandGroup(g =>
      g.setName('wondertrade').setDescription('ตั้งค่า public Wonder Trade panel')
        .addSubcommand(s =>
          s.setName('setup')
            .setDescription('ส่ง public Wonder Trade panel ไปยังช่อง')
            .addChannelOption(o => o.setName('channel').setDescription('ช่องสำหรับ panel').setRequired(true))
        )
    )

    // /pet catalog image
    .addSubcommandGroup(g =>
      g.setName('catalog').setDescription('จัดการ catalog สัตว์')
        .addSubcommand(s =>
          s.setName('image')
            .setDescription('[Admin] ตั้ง image URL ให้สัตว์')
            .addStringOption(o =>
              o.setName('species').setDescription('Species ID เช่น dragon_fire').setRequired(true)
            )
            .addStringOption(o =>
              o.setName('url').setDescription('URL รูปภาพ (ใส่ - เพื่อลบรูป)').setRequired(true)
            )
        )
    )

    // /pet give (debug/admin)
    .addSubcommand(s =>
      s.setName('give')
        .setDescription('[Admin] ให้สัตว์แก่ผู้ใช้')
        .addUserOption(o => o.setName('user').setDescription('ผู้รับ').setRequired(true))
        .addStringOption(o =>
          o.setName('species').setDescription('species ID').setRequired(true)
            .addChoices(
              { name: '🐉 มังกรไฟ (legendary)', value: 'dragon_fire' },
              { name: '🐺 หมาป่าเงา (epic)',    value: 'wolf_shadow' },
              { name: '🦋 ผีเสื้อน้ำแข็ง (rare)', value: 'butterfly_ice' },
              { name: '🦊 จิ้งจอกวิญญาณ (uncommon)', value: 'fox_spirit' },
              { name: '🐱 แมวส้ม (common)',    value: 'cat_orange' },
            )
        )
    )

    // /pet coins (debug/admin)
    .addSubcommand(s =>
      s.setName('coins')
        .setDescription('[Admin] ให้ coins แก่ผู้ใช้')
        .addUserOption(o => o.setName('user').setDescription('ผู้รับ').setRequired(true))
        .addIntegerOption(o => o.setName('amount').setDescription('จำนวน coins').setRequired(true).setMinValue(1))
    ),
};
