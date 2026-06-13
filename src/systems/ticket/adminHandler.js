const { EmbedBuilder, ChannelType } = require('discord.js');
const ticketManager = require('./managers/ticketManager');
const ticketPanel   = require('./panels/ticketPanel');

async function handleCommand(interaction) {
  const sub     = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  // ─── /ticket global ───────────────────────────────────────────────────────
  if (sub === 'global') {
    const adminRole  = interaction.options.getRole('adminrole');
    const logChannel = interaction.options.getChannel('logchannel');

    ticketManager.setGlobal(guildId, {
      adminRole:  adminRole.id,
      logChannel: logChannel?.id,
    });

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('✅ ตั้งค่า Ticket Global สำเร็จ')
        .addFields(
          { name: '👮 Admin Role',  value: `<@&${adminRole.id}>`,          inline: true },
          { name: '📋 Log Channel', value: logChannel ? `<#${logChannel.id}>` : 'ไม่ได้ตั้ง', inline: true },
        )
        .setColor(0x57f287)],
      ephemeral: true,
    });
    return;
  }

  // ─── /ticket add ──────────────────────────────────────────────────────────
  if (sub === 'add') {
    const channel       = interaction.options.getChannel('channel');
    const rolesStr      = interaction.options.getString('roles');
    const topicsStr     = interaction.options.getString('topics');
    const categoryInput = interaction.options.getString('category');

    // Parse role IDs from mentions or raw snowflakes
    const roleIds = [...(rolesStr?.matchAll(/<@&(\d+)>|(\d{17,20})/g) || [])]
      .map(m => m[1] || m[2])
      .filter(Boolean);

    if (!roleIds.length) {
      return interaction.reply({ content: '❌ ระบุ role อย่างน้อย 1 ตัว เช่น @Member', ephemeral: true });
    }

    const topics = topicsStr
      ? topicsStr.split(',').map(t => t.trim()).filter(Boolean)
      : ticketManager.DEFAULT_TOPICS;

    await interaction.deferReply({ ephemeral: true });

    // Resolve category (name or ID → category ID)
    let categoryId = null;
    if (categoryInput) {
      categoryId = await resolveCategoryId(interaction.guild, categoryInput);
      if (!categoryId) {
        return interaction.followUp({ content: `❌ ไม่พบ category "${categoryInput}" และสร้างใหม่ไม่สำเร็จ`, ephemeral: true });
      }
    }

    const panelMsg = await channel.send(ticketPanel.build(channel.id, { roles: roleIds, topics }));
    try { await panelMsg.pin(); } catch {}

    ticketManager.addPanel(guildId, channel.id, roleIds, topics, categoryId, panelMsg.id);

    const catName = categoryInput
      ? interaction.guild.channels.cache.get(categoryId)?.name || categoryInput
      : 'ไม่ได้ตั้ง';

    await interaction.followUp({
      embeds: [new EmbedBuilder()
        .setTitle('✅ เพิ่ม Ticket Panel สำเร็จ')
        .addFields(
          { name: '📌 Channel',    value: `${channel}`,                         inline: true },
          { name: '👥 Roles',      value: roleIds.map(r => `<@&${r}>`).join(' '), inline: true },
          { name: '📁 Category',   value: catName,                              inline: true },
          { name: '📋 หัวข้อ',     value: topics.join(', ') },
        )
        .setColor(0x57f287)],
      ephemeral: true,
    });
    return;
  }

  // ─── /ticket remove ───────────────────────────────────────────────────────
  if (sub === 'remove') {
    const channel = interaction.options.getChannel('channel');
    const panel   = ticketManager.getPanel(guildId, channel.id);

    if (!panel) {
      return interaction.reply({ content: '❌ ไม่พบ ticket panel ในช่องนี้', ephemeral: true });
    }

    if (panel.messageId) {
      try {
        const msg = await channel.messages.fetch(panel.messageId);
        await msg.delete();
      } catch {}
    }

    ticketManager.removePanel(guildId, channel.id);
    await interaction.reply({ content: `✅ ลบ ticket panel ออกจาก ${channel} แล้ว`, ephemeral: true });
  }
}

async function resolveCategoryId(guild, input) {
  if (/^\d+$/.test(input)) {
    const cat = guild.channels.cache.get(input);
    return cat?.type === ChannelType.GuildCategory ? input : null;
  }
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === input.toLowerCase()
  );
  if (existing) return existing.id;
  try {
    const created = await guild.channels.create({ name: input, type: ChannelType.GuildCategory });
    return created.id;
  } catch {
    return null;
  }
}

module.exports = { handleCommand };
