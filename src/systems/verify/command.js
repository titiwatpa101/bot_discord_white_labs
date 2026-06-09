const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('ระบบยืนยันสมาชิก')

    // /verify setup
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('[Admin] ตั้งค่าระบบยืนยันและส่งข้อความไปยังช่องนี้')
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('Role ที่จะให้เมื่อยืนยันสำเร็จ').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('button').setDescription('ข้อความบนปุ่ม เช่น Welcome to Lab.').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('min_days')
            .setDescription('อายุบัญชีขั้นต่ำ (วัน) — default: 30')
            .setMinValue(0)
            .setMaxValue(365)
        )
    )

    // /verify send
    .addSubcommand((sub) =>
      sub
        .setName('send')
        .setDescription('[Admin] ส่งข้อความยืนยันใหม่ไปยังช่องนี้ (ใช้ config เดิม)')
    ),
};
