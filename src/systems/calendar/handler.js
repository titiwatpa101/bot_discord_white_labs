const {
  EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle,
  RoleSelectMenuBuilder, UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  AttachmentBuilder,
} = require('discord.js');

const calendarManager  = require('./managers/calendarManager');
const calendarRenderer = require('./renderers/calendarRenderer');
const calendarPanel    = require('./panels/calendarPanel');

// intermediate booking state: guildId_userId → { year, month, whoType, whoId, whoName }
const bookingSessions = new Map();

// ─── role guard ───────────────────────────────────────────────────────────────

function isAllowed(interaction) {
  const allowed = calendarManager.getAllowedRoles(interaction.guildId);
  if (!allowed.length) return true; // ไม่ได้ตั้ง = ทุกคนใช้ได้
  return allowed.some(rId => interaction.member.roles.cache.has(rId));
}

function denyReply(interaction) {
  return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งาน calendar', ephemeral: true });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseYM(yyyymm) {
  return { year: parseInt(yyyymm.slice(0, 4)), month: parseInt(yyyymm.slice(4, 6)) };
}

async function buildPayload(guildId, year, month) {
  const bookings   = calendarManager.getMonthBookings(guildId, year, month);
  const buffer     = await calendarRenderer.render(year, month, bookings);
  const { embed, rows } = calendarPanel.build(year, month, bookings);
  const attachment = new AttachmentBuilder(buffer, { name: 'calendar.png' });
  return { embeds: [embed], files: [attachment], components: rows };
}

async function refreshPanel(client, guildId, year, month) {
  const pd = calendarManager.getPanel(guildId);
  if (!pd) return;
  const ch = client.channels.cache.get(pd.channelId)
    || await client.channels.fetch(pd.channelId).catch(() => null);
  if (!ch) return;
  const msg = await ch.messages.fetch(pd.messageId).catch(() => null);
  if (!msg) return;
  const payload = await buildPayload(guildId, year, month);
  await msg.edit(payload);
}

// ─── Button ───────────────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const id = interaction.customId;
  if (id.startsWith('cal_nav_'))        return handleNav(interaction);
  if (id === 'cal_today')               return handleToday(interaction);
  if (id.startsWith('cal_openbook_'))   return handleOpenBook(interaction);
  if (id.startsWith('cal_booktype_'))   return handleBookType(interaction);
  if (id.startsWith('cal_booklist_'))   return handleBookList(interaction);
  if (id.startsWith('cal_cancellist_')) return handleCancelList(interaction);
  if (id.startsWith('cal_ack_'))        return handleAck(interaction);
}

async function handleNav(interaction) {
  const yyyymm = interaction.customId.replace('cal_nav_', '');
  const { year, month } = parseYM(yyyymm);
  await interaction.deferUpdate();
  const payload = await buildPayload(interaction.guildId, year, month);
  await interaction.editReply(payload);
}

async function handleToday(interaction) {
  const now = new Date();
  await interaction.deferUpdate();
  const payload = await buildPayload(interaction.guildId, now.getFullYear(), now.getMonth() + 1);
  await interaction.editReply(payload);
}

async function handleOpenBook(interaction) {
  if (!isAllowed(interaction)) return denyReply(interaction);
  const yyyymm = interaction.customId.replace('cal_openbook_', '');

  await interaction.reply({
    content: '📌 จองสำหรับ:',
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`cal_booktype_role_${yyyymm}`)
          .setLabel('👥 Role')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`cal_booktype_user_${yyyymm}`)
          .setLabel('👤 User')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`cal_booktype_none_${yyyymm}`)
          .setLabel('📝 ทั่วไป')
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
    ephemeral: true,
  });
}

async function handleBookType(interaction) {
  const rest     = interaction.customId.replace('cal_booktype_', '');
  const sepIdx   = rest.indexOf('_');
  const type     = rest.slice(0, sepIdx);         // 'role' | 'user' | 'none'
  const yyyymm   = rest.slice(sepIdx + 1);
  const { year, month } = parseYM(yyyymm);

  const key = `${interaction.guildId}_${interaction.user.id}`;
  bookingSessions.set(key, { year, month, whoType: type, whoId: null, whoName: null });

  if (type === 'none') {
    return interaction.showModal(buildBookModal(yyyymm, year, month));
  }

  const menu = type === 'role'
    ? new RoleSelectMenuBuilder().setCustomId(`calsel_role_${yyyymm}`).setPlaceholder('เลือก Role...')
    : new UserSelectMenuBuilder().setCustomId(`calsel_user_${yyyymm}`).setPlaceholder('เลือก User...');

  await interaction.update({
    content: type === 'role' ? '👥 เลือก Role:' : '👤 เลือก User:',
    components: [new ActionRowBuilder().addComponents(menu)],
  });
}

async function handleBookList(interaction) {
  if (!isAllowed(interaction)) return denyReply(interaction);
  const yyyymm = interaction.customId.replace('cal_booklist_', '');
  const { year, month } = parseYM(yyyymm);
  const bookings = calendarManager.getMonthBookings(interaction.guildId, year, month);

  const lines = [];
  for (const [date, list] of Object.entries(bookings).sort()) {
    const day = parseInt(date.slice(8));
    for (const b of list) {
      const who = b.whoType === 'role' ? `<@&${b.whoId}>`
        : b.whoType === 'user' ? `<@${b.whoId}>` : '';
      lines.push(`• **${day}** — ${b.topic}${who ? '  ' + who : ''}`);
    }
  }

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle(`📋 การจอง — ${calendarPanel.MONTH_TH[month - 1]} ${year}`)
      .setDescription(lines.length ? lines.join('\n') : 'ยังไม่มีการจองเดือนนี้')
      .setColor(0xe040fb)],
    ephemeral: true,
  });
}

async function handleAck(interaction) {
  if (!isAllowed(interaction)) return denyReply(interaction);

  const dateStr = interaction.customId.replace('cal_ack_', '');
  const guildId = interaction.guildId;

  calendarManager.removeAllBookingsForDate(guildId, dateStr);

  const [year, month] = dateStr.split('-').map(Number);
  await refreshPanel(interaction.client, guildId, year, month);

  const ackEmbed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(0x43b581)
    .setFooter({ text: `${dateStr} • รับทราบโดย ${interaction.member.displayName}` });

  await interaction.update({
    embeds: [ackEmbed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`cal_ack_${dateStr}`)
          .setLabel('✅ รับทราบแล้ว')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      ),
    ],
  });
}

async function handleCancelList(interaction) {
  if (!isAllowed(interaction)) return denyReply(interaction);
  const yyyymm = interaction.customId.replace('cal_cancellist_', '');
  const { year, month } = parseYM(yyyymm);
  const bookings = calendarManager.getMonthBookings(interaction.guildId, year, month);

  const options = [];
  for (const [date, list] of Object.entries(bookings).sort()) {
    const day = parseInt(date.slice(8));
    list.forEach((b, i) => {
      const who = b.whoType !== 'none' ? ` (${b.whoName || b.whoId})` : '';
      options.push({
        label:       `${day} — ${b.topic}${who}`.slice(0, 100),
        value:       `${date}_${i}`,
      });
    });
  }

  await interaction.reply({
    content: '🗑️ เลือกรายการที่ต้องการยกเลิก:',
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`calsel_cancel_${yyyymm}`)
          .setPlaceholder('เลือกการจอง...')
          .addOptions(options.slice(0, 25))
      ),
    ],
    ephemeral: true,
  });
}

// ─── Role / User Select ───────────────────────────────────────────────────────

async function handleRoleSelect(interaction) {
  const yyyymm  = interaction.customId.replace('calsel_role_', '');
  const { year, month } = parseYM(yyyymm);
  const roleId  = interaction.values[0];
  const role    = interaction.guild.roles.cache.get(roleId);

  const key     = `${interaction.guildId}_${interaction.user.id}`;
  const session = bookingSessions.get(key) || { year, month, whoType: 'role' };
  session.whoId   = roleId;
  session.whoName = role?.name || roleId;
  bookingSessions.set(key, session);

  await interaction.showModal(buildBookModal(yyyymm, year, month));
}

async function handleUserSelect(interaction) {
  const yyyymm  = interaction.customId.replace('calsel_user_', '');
  const { year, month } = parseYM(yyyymm);
  const userId  = interaction.values[0];
  const member  = await interaction.guild.members.fetch(userId).catch(() => null);

  const key     = `${interaction.guildId}_${interaction.user.id}`;
  const session = bookingSessions.get(key) || { year, month, whoType: 'user' };
  session.whoId   = userId;
  session.whoName = member?.displayName || userId;
  bookingSessions.set(key, session);

  await interaction.showModal(buildBookModal(yyyymm, year, month));
}

async function handleCancelSelect(interaction) {
  const yyyymm = interaction.customId.replace('calsel_cancel_', '');
  const value  = interaction.values[0]; // "YYYY-MM-DD_INDEX"
  const li     = value.lastIndexOf('_');
  const dateStr = value.slice(0, li);
  const idx     = parseInt(value.slice(li + 1));

  calendarManager.removeBooking(interaction.guildId, dateStr, idx);

  const { year, month } = parseYM(yyyymm);
  await interaction.deferUpdate();
  await refreshPanel(interaction.client, interaction.guildId, year, month);
  await interaction.followUp({ content: '✅ ยกเลิกการจองแล้ว', ephemeral: true });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

async function handleModal(interaction) {
  if (interaction.customId.startsWith('calmodal_book_')) {
    return handleBookModal(interaction);
  }
}

async function handleBookModal(interaction) {
  const yyyymm  = interaction.customId.replace('calmodal_book_', '');
  const key     = `${interaction.guildId}_${interaction.user.id}`;
  const session = bookingSessions.get(key) || {};
  bookingSessions.delete(key);

  const { year, month } = parseYM(yyyymm);
  const day   = parseInt(interaction.fields.getTextInputValue('day'));
  const topic = interaction.fields.getTextInputValue('topic').trim();

  if (isNaN(day) || day < 1 || day > 31) {
    return interaction.reply({ content: '❌ วันที่ไม่ถูกต้อง (ใส่ 1–31)', ephemeral: true });
  }

  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const booking = {
    topic,
    whoType:   session.whoType || 'none',
    whoId:     session.whoId   || null,
    whoName:   session.whoName || null,
    createdBy: interaction.user.id,
  };

  calendarManager.addBooking(interaction.guildId, dateStr, booking);

  await interaction.deferReply({ ephemeral: true });
  await refreshPanel(interaction.client, interaction.guildId, year, month);

  const whoStr = booking.whoType === 'role' ? `  <@&${booking.whoId}>`
    : booking.whoType === 'user' ? `  <@${booking.whoId}>` : '';
  await interaction.followUp({
    content: `✅ จอง **${day} ${calendarPanel.MONTH_TH[month - 1]} ${year}** — ${topic}${whoStr}`,
    ephemeral: true,
  });
}

// ─── Modal builder ────────────────────────────────────────────────────────────

function buildBookModal(yyyymm, year, month) {
  return new ModalBuilder()
    .setCustomId(`calmodal_book_${yyyymm}`)
    .setTitle(`📌 จองวัน — ${calendarPanel.MONTH_SHORT[month - 1]} ${year}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('day')
          .setLabel('วันที่ (1–31)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('เช่น 14')
          .setRequired(true)
          .setMaxLength(2)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('topic')
          .setLabel('หัวข้อ')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('เช่น Guild War')
          .setRequired(true)
          .setMaxLength(50)
      )
    );
}

// ─── Setup command ────────────────────────────────────────────────────────────

function parseRoleIds(str) {
  if (!str) return [];
  return [...(str.matchAll(/<@&(\d+)>|(\d{17,20})/g))]
    .map(m => m[1] || m[2])
    .filter(Boolean);
}

async function handleSetup(interaction) {
  const sub = interaction.options.getSubcommand();

  // ── /calendar notify ───────────────────────────────────────────────────────
  if (sub === 'notify') {
    const channel = interaction.options.getChannel('channel');
    const time    = interaction.options.getString('time') || '08:00';
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return interaction.reply({ content: '❌ รูปแบบเวลาไม่ถูกต้อง ใช้ HH:MM เช่น 08:00', ephemeral: true });
    }
    calendarManager.setNotifyConfig(interaction.guildId, channel.id, time);
    return interaction.reply({ content: `✅ ตั้งช่องแจ้งเตือนที่ ${channel} เวลา **${time}** แล้ว`, ephemeral: true });
  }

  // ── /calendar remove ───────────────────────────────────────────────────────
  if (sub === 'remove') {
    const pd = calendarManager.getPanel(interaction.guildId);
    if (!pd) return interaction.reply({ content: '❌ ไม่พบ calendar panel ในเซิร์ฟเวอร์นี้', ephemeral: true });

    const ch = interaction.guild.channels.cache.get(pd.channelId);
    if (ch) {
      const msg = await ch.messages.fetch(pd.messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
    }

    calendarManager.removePanel(interaction.guildId);
    return interaction.reply({ content: '✅ ลบ calendar panel แล้ว', ephemeral: true });
  }

  // ── /calendar roles ────────────────────────────────────────────────────────
  if (sub === 'roles') {
    const roleIds = parseRoleIds(interaction.options.getString('roles'));
    calendarManager.setAllowedRoles(interaction.guildId, roleIds);
    const desc = roleIds.length
      ? roleIds.map(r => `<@&${r}>`).join(' ')
      : 'ทุกคน (ไม่จำกัด role)';
    return interaction.reply({ content: `✅ กำหนด role calendar: ${desc}`, ephemeral: true });
  }

  // ── /calendar setup ────────────────────────────────────────────────────────
  const channel = interaction.options.getChannel('channel');
  const roleIds = parseRoleIds(interaction.options.getString('roles'));
  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth() + 1;

  await interaction.deferReply({ ephemeral: true });

  if (roleIds.length) calendarManager.setAllowedRoles(interaction.guildId, roleIds);

  const payload = await buildPayload(interaction.guildId, year, month);
  const msg     = await channel.send(payload);
  try { await msg.pin(); } catch {}

  calendarManager.setPanel(interaction.guildId, channel.id, msg.id);

  const roleDesc = roleIds.length ? roleIds.map(r => `<@&${r}>`).join(' ') : 'ทุกคน';
  await interaction.followUp({
    content: `✅ ส่ง calendar panel ไปที่ ${channel} แล้ว\n👥 Role ที่ใช้ได้: ${roleDesc}`,
    ephemeral: true,
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

function buildNotifyPayload(dateStr, bookings) {
  const lines = bookings.map(b => {
    const who = b.whoType === 'role' ? `  <@&${b.whoId}>`
      : b.whoType === 'user' ? `  <@${b.whoId}>` : '';
    return `• **${b.topic}**${who}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('📅 มีการจองวันนี้')
    .setDescription(lines.join('\n'))
    .setColor(0xe040fb)
    .setFooter({ text: dateStr });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cal_ack_${dateStr}`)
      .setLabel('✅ รับทราบ')
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

function startScheduler(client) {
  setInterval(async () => {
    const now   = new Date();
    const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    for (const guildId of calendarManager.getAllGuildIds()) {
      const cfg = calendarManager.getNotifyConfig(guildId);
      if (!cfg || cfg.time !== hhmm) continue;

      const bookings = calendarManager.getMonthBookings(guildId, now.getFullYear(), now.getMonth()+1)[today];
      if (!bookings?.length) continue;

      try {
        const ch = client.channels.cache.get(cfg.channelId)
          || await client.channels.fetch(cfg.channelId).catch(() => null);
        if (!ch) continue;

        await ch.send(buildNotifyPayload(today, bookings));
      } catch (err) {
        console.error('[calendar] notify error:', err);
      }
    }
  }, 60_000);
}

module.exports = {
  handleButton,
  handleRoleSelect,
  handleUserSelect,
  handleCancelSelect,
  handleModal,
  handleSetup,
  startScheduler,
};
