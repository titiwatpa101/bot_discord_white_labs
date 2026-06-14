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
    ),
};
