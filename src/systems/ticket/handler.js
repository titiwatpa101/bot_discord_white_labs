const {
  EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, UserSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  AttachmentBuilder, PermissionFlagsBits, ChannelType,
} = require('discord.js');

const ticketManager = require('./managers/ticketManager');
const controlPanel  = require('./panels/controlPanel');

// ─── Button ───────────────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const id = interaction.customId;
  if (id.startsWith('tk_create_'))  return handleCreate(interaction);
  if (id.startsWith('tk_claim_'))   return handleClaim(interaction);
  if (id.startsWith('tk_adduser_')) return handleAddUser(interaction);
  if (id.startsWith('tk_close_'))   return handleClose(interaction);
}

// ─── String Select ────────────────────────────────────────────────────────────

async function handleSelect(interaction) {
  // customId: tksel_topic_PCHID
  const panelChannelId = interaction.customId.replace('tksel_topic_', '');
  const selected       = interaction.values[0];
  const guildId        = interaction.guildId;

  const panel = ticketManager.getPanel(guildId, panelChannelId);
  if (!panel) return interaction.reply({ content: '❌ ไม่พบการตั้งค่า panel', ephemeral: true });

  const topics = panel.topics || ticketManager.DEFAULT_TOPICS;

  if (selected === '__other__') {
    return interaction.showModal(
      new ModalBuilder()
        .setCustomId(`tkmodal_custom_${panelChannelId}`)
        .setTitle('สร้าง Ticket — กำหนดหัวข้อเอง')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('topic')
              .setLabel('หัวข้อ')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('เช่น ปัญหาการล็อกอิน')
              .setRequired(true)
              .setMaxLength(50)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('description')
              .setLabel('รายละเอียด')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('อธิบายปัญหาหรือคำถามของคุณ...')
              .setRequired(true)
              .setMaxLength(1000)
          )
        )
    );
  }

  const topicIdx   = parseInt(selected, 10);
  const topicLabel = topics[topicIdx] || topics[0];

  return interaction.showModal(
    new ModalBuilder()
      .setCustomId(`tkmodal_detail_${panelChannelId}_${topicIdx}`)
      .setTitle(`สร้าง Ticket — ${topicLabel.slice(0, 40)}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('รายละเอียด')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('อธิบายปัญหาหรือคำถามของคุณ...')
            .setRequired(true)
            .setMaxLength(1000)
        )
      )
  );
}

// ─── User Select ──────────────────────────────────────────────────────────────

async function handleUserSelect(interaction) {
  // customId: tkusr_add_TCHID
  const ticketChannelId = interaction.customId.replace('tkusr_add_', '');
  const guildId         = interaction.guildId;

  const ticket = ticketManager.getTicket(guildId, ticketChannelId);
  if (!ticket) return interaction.reply({ content: '❌ ไม่พบข้อมูล ticket', ephemeral: true });

  const targetUserId  = interaction.values[0];
  const ticketChannel = interaction.guild.channels.cache.get(ticketChannelId);
  if (!ticketChannel) return interaction.reply({ content: '❌ ไม่พบช่อง ticket', ephemeral: true });

  await ticketChannel.permissionOverwrites.edit(targetUserId, {
    [PermissionFlagsBits.ViewChannel]:       true,
    [PermissionFlagsBits.SendMessages]:      true,
    [PermissionFlagsBits.ReadMessageHistory]:true,
  });

  const addedUsers = ticket.addedUsers || [];
  if (!addedUsers.includes(targetUserId)) addedUsers.push(targetUserId);
  ticketManager.updateTicket(guildId, ticketChannelId, { addedUsers });

  await ticketChannel.send({ content: `➕ <@${interaction.user.id}> ได้เพิ่ม <@${targetUserId}> เข้า ticket นี้` });
  await interaction.reply({ content: `✅ เพิ่ม <@${targetUserId}> เรียบร้อย`, ephemeral: true });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

async function handleModal(interaction) {
  const id = interaction.customId;
  if (id.startsWith('tkmodal_detail_'))  return handleDetailModal(interaction);
  if (id.startsWith('tkmodal_custom_'))  return handleCustomModal(interaction);
  if (id.startsWith('tkmodal_close_'))   return handleCloseModal(interaction);
}

async function handleDetailModal(interaction) {
  // customId: tkmodal_detail_PCHID_TIDX
  const raw   = interaction.customId.replace('tkmodal_detail_', '');
  const lastUs = raw.lastIndexOf('_');
  const panelChannelId = raw.slice(0, lastUs);
  const topicIdx       = parseInt(raw.slice(lastUs + 1), 10);

  const guildId = interaction.guildId;
  const panel   = ticketManager.getPanel(guildId, panelChannelId);
  if (!panel) return interaction.reply({ content: '❌ ไม่พบการตั้งค่า panel', ephemeral: true });

  const topics = panel.topics || ticketManager.DEFAULT_TOPICS;
  const topic  = topics[topicIdx] || topics[0];
  const desc   = interaction.fields.getTextInputValue('description');

  await createTicketChannel(interaction, guildId, panelChannelId, topic, desc);
}

async function handleCustomModal(interaction) {
  // customId: tkmodal_custom_PCHID
  const panelChannelId = interaction.customId.replace('tkmodal_custom_', '');
  const guildId        = interaction.guildId;

  const topic = interaction.fields.getTextInputValue('topic');
  const desc  = interaction.fields.getTextInputValue('description');

  await createTicketChannel(interaction, guildId, panelChannelId, topic, desc, true);
}

async function handleCloseModal(interaction) {
  // customId: tkmodal_close_TCHID
  const ticketChannelId = interaction.customId.replace('tkmodal_close_', '');
  const guildId         = interaction.guildId;

  const ticket = ticketManager.getTicket(guildId, ticketChannelId);
  if (!ticket) return interaction.reply({ content: '❌ ไม่พบข้อมูล ticket', ephemeral: true });

  const reason = interaction.fields.getTextInputValue('reason') || 'ไม่ระบุ';

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.guild.channels.cache.get(ticketChannelId)
    || await interaction.guild.channels.fetch(ticketChannelId).catch(() => null);

  // Build transcript
  let transcript = `Ticket #${ticket.counter} — ${ticket.topic}\n`;
  transcript    += `เปิดโดย: ${ticket.userId} | ปิดโดย: ${interaction.user.tag}\n`;
  transcript    += `เหตุผล: ${reason}\n`;
  transcript    += '─'.repeat(60) + '\n';

  if (channel) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sorted   = [...messages.values()].reverse();
      transcript += sorted
        .map(m => `[${new Date(m.createdTimestamp).toLocaleString('th-TH')}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`)
        .join('\n');
    } catch {}
  }

  // DM ticket creator
  try {
    const member = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
    if (member) {
      await member.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔒 Ticket ของคุณถูกปิดแล้ว')
          .setDescription(
            `**Server:** ${interaction.guild.name}\n` +
            `**หัวข้อ:** ${ticket.topic}\n` +
            `**ปิดโดย:** ${interaction.user.tag}\n` +
            `**เหตุผล:** ${reason}`
          )
          .setColor(0xed4245)
          .setTimestamp()],
      });
    }
  } catch {}

  // Log to logChannel
  const gConfig = ticketManager.guild(guildId);
  if (gConfig.logChannel) {
    const logCh = interaction.guild.channels.cache.get(gConfig.logChannel)
      || await interaction.guild.channels.fetch(gConfig.logChannel).catch(() => null);
    if (logCh) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`🔒 Ticket #${ticket.counter} ปิดแล้ว`)
        .addFields(
          { name: 'หัวข้อ',   value: ticket.topic,                inline: true },
          { name: 'เปิดโดย',  value: `<@${ticket.userId}>`,       inline: true },
          { name: 'ปิดโดย',   value: `<@${interaction.user.id}>`, inline: true },
          { name: 'เหตุผล',   value: reason },
        )
        .setColor(0xed4245)
        .setTimestamp();

      const buf        = Buffer.from(transcript, 'utf8');
      const attachment = new AttachmentBuilder(buf, { name: `ticket-${ticket.counter}-log.txt` });
      await logCh.send({ embeds: [logEmbed], files: [attachment] });
    }
  }

  // Remove data first, then delete channel
  ticketManager.closeTicket(guildId, ticketChannelId);
  if (channel) {
    await channel.delete(`Ticket #${ticket.counter} closed by ${interaction.user.tag}`);
  }

  try { await interaction.followUp({ content: '✅ ปิด ticket แล้ว', ephemeral: true }); } catch {}
}

// ─── Button action helpers ────────────────────────────────────────────────────

async function handleCreate(interaction) {
  const panelChannelId = interaction.customId.replace('tk_create_', '');
  const guildId        = interaction.guildId;

  const panel = ticketManager.getPanel(guildId, panelChannelId);
  if (!panel) return interaction.reply({ content: '❌ ไม่พบการตั้งค่า panel', ephemeral: true });

  // Role check
  const memberRoles = interaction.member.roles.cache;
  const allowed     = panel.roles.some(rId => memberRoles.has(rId));
  if (!allowed) {
    return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์สร้าง ticket ในช่องนี้', ephemeral: true });
  }

  const topics  = panel.topics || ticketManager.DEFAULT_TOPICS;
  const options = topics.map((t, i) => ({ label: t.slice(0, 100), value: String(i) }));
  options.push({ label: '➕ อื่นๆ (กำหนดหัวข้อเอง)', value: '__other__' });

  await interaction.reply({
    content: '📋 เลือกหัวข้อ ticket:',
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`tksel_topic_${panelChannelId}`)
          .setPlaceholder('เลือกหัวข้อ...')
          .addOptions(options)
      ),
    ],
    ephemeral: true,
  });
}

async function handleClaim(interaction) {
  const ticketChannelId = interaction.customId.replace('tk_claim_', '');
  const guildId         = interaction.guildId;

  if (!isAdmin(interaction)) {
    return interaction.reply({ content: '❌ เฉพาะ admin เท่านั้นที่ claim ได้', ephemeral: true });
  }

  const ticket = ticketManager.getTicket(guildId, ticketChannelId);
  if (!ticket) return interaction.reply({ content: '❌ ไม่พบข้อมูล ticket', ephemeral: true });
  if (ticket.claimedBy) return interaction.reply({ content: '❌ ticket นี้ถูก claim ไปแล้ว', ephemeral: true });

  ticketManager.updateTicket(guildId, ticketChannelId, { claimedBy: interaction.user.id });
  const updated = ticketManager.getTicket(guildId, ticketChannelId);

  // Update pinned control panel
  if (ticket.controlMsgId) {
    try {
      const ch  = interaction.guild.channels.cache.get(ticketChannelId);
      const msg = await ch?.messages.fetch(ticket.controlMsgId);
      if (msg) await msg.edit(controlPanel.build(ticketChannelId, updated));
    } catch {}
  }

  await interaction.reply({ content: `✅ <@${interaction.user.id}> ได้รับ ticket นี้แล้ว` });
}

async function handleAddUser(interaction) {
  const ticketChannelId = interaction.customId.replace('tk_adduser_', '');

  if (!isAdmin(interaction)) {
    return interaction.reply({ content: '❌ เฉพาะ admin เท่านั้น', ephemeral: true });
  }

  await interaction.reply({
    content: '🔍 เลือก user ที่ต้องการเพิ่มเข้า ticket:',
    components: [
      new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`tkusr_add_${ticketChannelId}`)
          .setPlaceholder('เลือก user...')
          .setMinValues(1)
          .setMaxValues(1)
      ),
    ],
    ephemeral: true,
  });
}

async function handleClose(interaction) {
  const ticketChannelId = interaction.customId.replace('tk_close_', '');

  if (!isAdmin(interaction)) {
    return interaction.reply({ content: '❌ เฉพาะ admin เท่านั้น', ephemeral: true });
  }

  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(`tkmodal_close_${ticketChannelId}`)
      .setTitle('ปิด Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('เหตุผลในการปิด (ไม่บังคับ)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(200)
        )
      )
  );
}

// ─── Create channel ───────────────────────────────────────────────────────────

async function createTicketChannel(interaction, guildId, panelChannelId, topic, description, isCustom = false) {
  await interaction.deferReply({ ephemeral: true });

  const gConfig = ticketManager.guild(guildId);
  const panel   = ticketManager.getPanel(guildId, panelChannelId);
  if (!panel) return interaction.followUp({ content: '❌ ไม่พบการตั้งค่า panel', ephemeral: true });

  const counter  = ticketManager.nextCounter(guildId);
  const topicIdx = isCustom ? 99 : (panel.topics || ticketManager.DEFAULT_TOPICS).indexOf(topic);
  const slug     = ticketManager.topicSlug(topic, topicIdx >= 0 ? topicIdx : 99);
  const chName   = `ticket-${slug}-${counter}`;

  const { guild } = interaction;
  const userId     = interaction.user.id;
  const adminRoles = gConfig.adminRoles || [];
  const categoryId = panel.category || null;

  const permOverwrites = [
    { id: guild.roles.everyone, deny:  [PermissionFlagsBits.ViewChannel] },
    { id: userId,               allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const rId of adminRoles) {
    permOverwrites.push({
      id:    rId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
    });
  }
  // Ensure bot keeps access despite @everyone deny
  if (guild.members.me) {
    permOverwrites.push({
      id: guild.members.me,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
    });
  }

  let ticketCh;
  try {
    ticketCh = await guild.channels.create({
      name:               chName,
      type:               ChannelType.GuildText,
      parent:             categoryId,
      permissionOverwrites: permOverwrites,
    });
  } catch (err) {
    console.error('[ticket] create channel error:', err);
    return interaction.followUp({ content: `❌ สร้างช่องไม่ได้: \`${err.message}\``, ephemeral: true });
  }

  const ticketData = {
    userId, topic, description,
    claimedBy:      null,
    addedUsers:     [],
    panelChannelId,
    controlMsgId:   null,
    counter,
    openedAt:       Date.now(),
  };
  ticketManager.openTicket(guildId, ticketCh.id, ticketData);

  // Welcome embed
  await ticketCh.send({
    embeds: [new EmbedBuilder()
      .setTitle(`🎫 Ticket #${counter} — ${topic}`)
      .setDescription(
        `สวัสดี <@${userId}>! ทีมงานจะมาช่วยเหลือคุณเร็วๆ นี้\n\n` +
        `**รายละเอียด:**\n${description}`
      )
      .setColor(0x5865f2)
      .setTimestamp()],
  });

  // Control panel (pinned)
  const ctrlMsg = await ticketCh.send(controlPanel.build(ticketCh.id, ticketData));
  try { await ctrlMsg.pin(); } catch {}
  ticketManager.updateTicket(guildId, ticketCh.id, { controlMsgId: ctrlMsg.id });

  // Log new ticket
  if (gConfig.logChannel) {
    const logCh = guild.channels.cache.get(gConfig.logChannel)
      || await guild.channels.fetch(gConfig.logChannel).catch(() => null);
    if (logCh) {
      await logCh.send({
        embeds: [new EmbedBuilder()
          .setTitle(`🎫 Ticket #${counter} เปิดแล้ว`)
          .addFields(
            { name: 'หัวข้อ',  value: topic,               inline: true },
            { name: 'เปิดโดย', value: `<@${userId}>`,      inline: true },
            { name: 'ช่อง',    value: `${ticketCh}`,        inline: true },
          )
          .setColor(0x57f287)
          .setTimestamp()],
      });
    }
  }

  await interaction.followUp({ content: `✅ สร้าง ticket สำเร็จ! → ${ticketCh}`, ephemeral: true });
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function isAdmin(interaction) {
  const gConfig    = ticketManager.guild(interaction.guildId);
  const adminRoles = gConfig.adminRoles || [];
  if (!adminRoles.length) {
    return interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
  }
  return adminRoles.some(rId => interaction.member.roles.cache.has(rId));
}

module.exports = { handleButton, handleSelect, handleUserSelect, handleModal };
