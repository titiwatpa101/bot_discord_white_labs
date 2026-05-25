const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const { getSession, getOrCreate, deleteSession } = require('./sessionManager');
const { generateOpening } = require('./aiService');
const { world: loadWorld, character: loadChar } = require('../../shared/promptLoader');
const { splitMessage } = require('../../shared/utils');
const { buildPanel, WORLD_LABELS, CHAR_LABELS } = require('./panel');

// ─── /rp slash command handler ────────────────────────────────────────────────

async function handleRp(interaction) {
  const sub = interaction.options.getSubcommand();
  const { channelId, guildId } = interaction;

  switch (sub) {
    case 'open': {
      const session = getSession(channelId);
      return interaction.reply(buildPanel(session));
    }

    case 'join': {
      const session = getOrCreate(channelId, guildId);
      const displayName = interaction.member?.displayName || interaction.user.username;
      const result = session.addToQueue(interaction.user.id, interaction.user.username, displayName);
      if (!result.success) {
        const msg = result.reason === 'already_in_queue'
          ? '❌ คุณอยู่ในคิวแล้ว!'
          : `❌ คิวเต็มแล้ว! (${session.maxPlayers} คน)`;
        return interaction.reply({ content: msg, ephemeral: true });
      }
      return interaction.reply({ content: `✅ **${displayName}** เข้าร่วมคิวที่ **#${result.position}** แล้ว!` });
    }

    case 'leave': {
      const session = getSession(channelId);
      if (!session || !session.isUserInQueue(interaction.user.id)) {
        return interaction.reply({ content: '❌ คุณไม่ได้อยู่ในคิว', ephemeral: true });
      }
      const displayName = interaction.member?.displayName || interaction.user.username;
      session.removeFromQueue(interaction.user.id);
      return interaction.reply({ content: `✅ **${displayName}** ออกจากคิวแล้ว` });
    }

    case 'queue': {
      const session = getSession(channelId);
      if (!session || session.queue.length === 0) {
        return interaction.reply({ content: '📋 คิวว่างอยู่ — ใช้ `/rp join` เพื่อเข้าร่วม', ephemeral: true });
      }
      const list = session.queue.map((u, i) => {
        const isCurrent = session.active && i === session.currentQueueIndex;
        const roleTag = u.role ? ` *(${u.role})*` : '';
        return `${isCurrent ? '▶️' : `${i + 1}.`} <@${u.userId}>${roleTag}${isCurrent ? ' *(กำลังเล่น)*' : ''}`;
      }).join('\n');
      return interaction.reply({
        embeds: [{
          title: '📋 คิวโรลเพลย์', description: list, color: 0x5865f2,
          fields: [
            { name: 'สถานะ', value: session.active ? '🟢 กำลังดำเนินการ' : '🔴 ยังไม่เริ่ม', inline: true },
            { name: 'ผู้เล่น', value: `${session.queue.length}${session.maxPlayers > 0 ? `/${session.maxPlayers}` : ''}`, inline: true },
          ],
        }],
      });
    }

    case 'role': {
      const session = getOrCreate(channelId, guildId);
      const description = interaction.options.getString('description');
      const displayName = interaction.member?.displayName || interaction.user.username;
      if (!session.isUserInQueue(interaction.user.id)) {
        return interaction.reply({ content: '❌ ต้องใช้ `/rp join` เข้าคิวก่อน', ephemeral: true });
      }
      session.setUserRole(interaction.user.id, description);
      return interaction.reply({
        embeds: [{ title: '🎭 กำหนดบทบาทแล้ว', description: `**${displayName}** รับบทเป็น\n> ${description}`, color: 0x5865f2 }],
      });
    }

    case 'world': {
      const session = getOrCreate(channelId, guildId);
      const preset = interaction.options.getString('preset');
      const prompt = loadWorld(preset);
      if (!prompt) return interaction.reply({ content: `❌ ไม่พบฉาก \`${preset}\``, ephemeral: true });
      session.setWorld(preset, prompt);
      return interaction.reply({
        embeds: [{ title: '🗺️ ตั้งฉากแล้ว', description: `**${WORLD_LABELS[preset] ?? preset}**\n*(ประวัติสนทนาถูกล้างเพื่อเริ่มโลกใหม่)*`, color: 0x2ecc71 }],
      });
    }

    case 'char': {
      const session = getOrCreate(channelId, guildId);
      const preset = interaction.options.getString('preset');
      const prompt = loadChar(preset);
      if (!prompt) return interaction.reply({ content: `❌ ไม่พบตัวละคร \`${preset}\``, ephemeral: true });
      session.setChar(preset, prompt);
      return interaction.reply({
        embeds: [{ title: '🎭 ตั้งตัวละครแล้ว', description: `**${CHAR_LABELS[preset] ?? preset}**\n*(ประวัติสนทนาถูกล้างเพื่อเริ่มตัวละครใหม่)*`, color: 0xe67e22 }],
      });
    }

    case 'setmax': {
      const session = getOrCreate(channelId, guildId);
      const players = interaction.options.getInteger('players');
      session.maxPlayers = players;
      return interaction.reply({
        content: players === 0 ? '✅ ไม่จำกัดจำนวนผู้เล่น' : `✅ จำกัดผู้เล่นสูงสุด **${players} คน**`,
      });
    }

    case 'start': {
      const session = getOrCreate(channelId, guildId);
      if (session.active) return interaction.reply({ content: '❌ เซสชันกำลังดำเนินการอยู่แล้ว!', ephemeral: true });
      if (session.queue.length === 0) return interaction.reply({ content: '❌ ยังไม่มีผู้เล่นในคิว!', ephemeral: true });
      session.active = true;
      session.currentQueueIndex = 0;
      const first = session.queue[0];
      await interaction.deferReply();
      try {
        const opening = await generateOpening(session);
        await interaction.editReply({
          embeds: [{ title: '🎭 เริ่มโรลเพลย์แล้ว!', description: `ผู้เล่น **${session.queue.length} คน** เข้าร่วมแล้ว`, color: 0x57f287,
            fields: [
              { name: 'ฉาก', value: session.worldName ? WORLD_LABELS[session.worldName] ?? session.worldName : '—', inline: true },
              { name: 'ตัวละคร', value: session.charName ? CHAR_LABELS[session.charName] ?? session.charName : '—', inline: true },
            ],
          }],
        });
        for (const chunk of splitMessage(opening)) await interaction.followUp(chunk);
        await interaction.followUp(`> ถึงคิวของ <@${first.userId}> แล้ว! ✨`);
      } catch (err) {
        console.error('[Opening Error]', err);
        await interaction.editReply({
          embeds: [{ title: '🎭 เริ่มโรลเพลย์แล้ว!', description: `ผู้เล่น **${session.queue.length} คน** เข้าร่วมแล้ว\n\n<@${first.userId}> คุณเป็นคนแรก! เริ่มเลย ✨`, color: 0x57f287 }],
        });
      }
      break;
    }

    case 'stop': {
      const session = getSession(channelId);
      if (!session || !session.active) return interaction.reply({ content: '❌ ไม่มีเซสชันที่กำลังดำเนินการอยู่', ephemeral: true });
      session.active = false;
      return interaction.reply({ embeds: [{ title: '🛑 หยุดโรลเพลย์แล้ว', description: 'เซสชันสิ้นสุด ประวัติยังคงอยู่', color: 0xed4245 }] });
    }

    case 'info': {
      const session = getSession(channelId);
      if (!session) return interaction.reply({ content: '📋 ยังไม่มีเซสชันในช่องนี้', ephemeral: true });
      return interaction.reply({
        embeds: [{ title: '📊 สถานะเซสชัน', color: 0x5865f2,
          fields: [
            { name: 'สถานะ', value: session.active ? '🟢 กำลังดำเนินการ' : '🔴 หยุดอยู่', inline: true },
            { name: 'ผู้เล่น', value: `${session.queue.length}${session.maxPlayers > 0 ? `/${session.maxPlayers}` : ''}`, inline: true },
            { name: 'รอบสนทนา', value: `${Math.floor(session.conversationHistory.length / 2)}`, inline: true },
            { name: 'คิวปัจจุบัน', value: session.active && session.currentUser ? `<@${session.currentUser.userId}>` : '—', inline: true },
            { name: '🗺️ ฉาก', value: session.worldName ? WORLD_LABELS[session.worldName] ?? session.worldName : '—', inline: true },
            { name: '🎭 ตัวละคร', value: session.charName ? CHAR_LABELS[session.charName] ?? session.charName : '—', inline: true },
          ],
        }],
      });
    }

    case 'skip': {
      const session = getSession(channelId);
      if (!session || !session.active || session.queue.length === 0) return interaction.reply({ content: '❌ ไม่มีเซสชันที่กำลังดำเนินการอยู่', ephemeral: true });
      const skipped = session.currentUser;
      session.currentQueueIndex = (session.currentQueueIndex + 1) % session.queue.length;
      const next = session.currentUser;
      return interaction.reply({ content: `⏭️ ข้ามเทิร์นของ <@${skipped.userId}>\nถึงคิวของ <@${next.userId}> แล้ว! 🎭` });
    }

    case 'reset': {
      const session = getSession(channelId);
      if (!session) return interaction.reply({ content: '❌ ไม่มีเซสชันในช่องนี้', ephemeral: true });
      session.conversationHistory = [];
      session.roundMessages = [];
      return interaction.reply({ content: '🔄 รีเซ็ตประวัติการสนทนาแล้ว' });
    }

    case 'clear': {
      deleteSession(channelId);
      return interaction.reply({ content: '🗑️ ล้างคิวและเซสชันทั้งหมดแล้ว' });
    }
  }
}

// ─── Button handler ───────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const { customId, channelId, guildId } = interaction;

  // Role button → show modal (cannot deferUpdate before showModal)
  if (customId === 'rp_role') {
    const modal = new ModalBuilder().setCustomId('rp_role_modal').setTitle('🎭 กำหนดบทบาทตัวละคร');
    const input = new TextInputBuilder()
      .setCustomId('rp_role_input')
      .setLabel('บรรยายตัวละครของคุณ')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('เช่น นักดาบสาวที่ผ่านสงครามมา มีแผลเป็นที่ใจ แต่ยังเชื่อในความยุติธรรม')
      .setRequired(true)
      .setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // Start button → special flow (needs channel.send for public opening)
  if (customId === 'rp_start') {
    const session = getOrCreate(channelId, guildId);
    if (session.active) {
      await interaction.deferUpdate();
      return interaction.editReply(buildPanel(session, '❌ session กำลังดำเนินการอยู่แล้ว'));
    }
    if (session.queue.length === 0) {
      await interaction.deferUpdate();
      return interaction.editReply(buildPanel(session, '❌ ยังไม่มีผู้เล่นในคิว กด Join ก่อน'));
    }
    session.active = true;
    session.currentQueueIndex = 0;
    const first = session.queue[0];
    await interaction.deferUpdate();
    await interaction.editReply(buildPanel(session, '⏳ กำลังสร้างฉากเปิด...'));
    try {
      await interaction.channel.send({
        embeds: [{
          title: '🎭 เริ่มโรลเพลย์แล้ว!',
          description: `ผู้เล่น **${session.queue.length} คน** เข้าร่วมแล้ว`,
          color: 0x57f287,
          fields: [
            { name: 'ฉาก', value: session.worldName ? WORLD_LABELS[session.worldName] ?? session.worldName : '—', inline: true },
            { name: 'ตัวละคร', value: session.charName ? CHAR_LABELS[session.charName] ?? session.charName : '—', inline: true },
          ],
        }],
      });
      const opening = await generateOpening(session);
      for (const chunk of splitMessage(opening)) await interaction.channel.send(chunk);
      await interaction.channel.send(`> ถึงคิวของ <@${first.userId}> แล้ว! ✨`);
      await interaction.editReply(buildPanel(session, '▶️ เริ่ม session แล้ว!'));
    } catch (err) {
      console.error('[Opening Error]', err);
      await interaction.channel.send(`<@${first.userId}> คุณเป็นคนแรก! ส่งข้อความเพื่อเริ่มเรื่องได้เลย ✨`);
      await interaction.editReply(buildPanel(session, '⚠️ สร้างฉากเปิดไม่สำเร็จ แต่ session เริ่มแล้ว'));
    }
    return;
  }

  // All other buttons
  await interaction.deferUpdate();
  const session = getSession(channelId);
  let status;

  switch (customId) {
    case 'rp_join': {
      const s = getOrCreate(channelId, guildId);
      const displayName = interaction.member?.displayName || interaction.user.username;
      const result = s.addToQueue(interaction.user.id, interaction.user.username, displayName);
      status = result.success
        ? `✅ **${displayName}** เข้าร่วมคิวที่ **#${result.position}** แล้ว!`
        : result.reason === 'already_in_queue'
          ? '❌ คุณอยู่ในคิวแล้ว!'
          : `❌ คิวเต็ม (${s.maxPlayers} คน)`;
      break;
    }

    case 'rp_leave': {
      if (!session || !session.isUserInQueue(interaction.user.id)) {
        status = '❌ คุณไม่ได้อยู่ในคิว';
      } else {
        const displayName = interaction.member?.displayName || interaction.user.username;
        session.removeFromQueue(interaction.user.id);
        status = `✅ **${displayName}** ออกจากคิวแล้ว`;
      }
      break;
    }

    case 'rp_queue': {
      if (!session || session.queue.length === 0) {
        status = '📋 คิวว่างอยู่';
      } else {
        status = session.queue.map((u, i) => {
          const isCurrent = session.active && i === session.currentQueueIndex;
          const roleTag = u.role ? ` *(${u.role})*` : '';
          return `${isCurrent ? '▶️' : `${i + 1}.`} <@${u.userId}>${roleTag}`;
        }).join('\n');
      }
      break;
    }

    case 'rp_info': {
      status = session
        ? [
            session.active ? '🟢 กำลังเล่น' : '🔴 หยุดอยู่',
            `ผู้เล่น ${session.queue.length} คน`,
            `รอบ ${Math.floor(session.conversationHistory.length / 2)}`,
            session.active && session.currentUser ? `คิว: <@${session.currentUser.userId}>` : '',
          ].filter(Boolean).join(' · ')
        : '❌ ยังไม่มี session ในช่องนี้';
      break;
    }

    case 'rp_stop': {
      if (!session || !session.active) {
        status = '❌ ไม่มี session ที่กำลังเล่นอยู่';
      } else {
        session.active = false;
        status = '⏹️ หยุด session แล้ว';
      }
      break;
    }

    case 'rp_skip': {
      if (!session || !session.active || session.queue.length === 0) {
        status = '❌ ไม่มี session ที่กำลังเล่นอยู่';
      } else {
        const skipped = session.currentUser;
        session.currentQueueIndex = (session.currentQueueIndex + 1) % session.queue.length;
        status = `⏭️ ข้าม <@${skipped.userId}> → ถึงคิว <@${session.currentUser.userId}>`;
        await interaction.channel.send(`> ถึงคิวของ <@${session.currentUser.userId}> แล้ว! 🎭`).catch(() => {});
      }
      break;
    }

    case 'rp_reset': {
      if (!session) {
        status = '❌ ไม่มี session ในช่องนี้';
      } else {
        session.conversationHistory = [];
        session.roundMessages = [];
        status = '🔄 รีเซ็ตประวัติแล้ว';
      }
      break;
    }

    case 'rp_clear': {
      deleteSession(channelId);
      status = '🗑️ ล้างทั้งหมดแล้ว';
      break;
    }
  }

  await interaction.editReply(buildPanel(getSession(channelId), status));
}

// ─── Select Menu handler ──────────────────────────────────────────────────────

async function handleSelect(interaction) {
  const { customId, channelId, guildId } = interaction;
  const value = interaction.values[0];
  await interaction.deferUpdate();
  const session = getOrCreate(channelId, guildId);
  let status;

  if (customId === 'rp_world_select') {
    const prompt = loadWorld(value);
    if (!prompt) {
      status = `❌ ไม่พบฉาก \`${value}\``;
    } else {
      session.setWorld(value, prompt);
      status = `🗺️ ตั้งฉากเป็น **${WORLD_LABELS[value] ?? value}** แล้ว *(ประวัติถูกล้าง)*`;
    }
  } else if (customId === 'rp_char_select') {
    const prompt = loadChar(value);
    if (!prompt) {
      status = `❌ ไม่พบตัวละคร \`${value}\``;
    } else {
      session.setChar(value, prompt);
      status = `🎭 ตั้งตัวละครเป็น **${CHAR_LABELS[value] ?? value}** แล้ว *(ประวัติถูกล้าง)*`;
    }
  }

  await interaction.editReply(buildPanel(getSession(channelId), status));
}

// ─── Modal Submit handler ─────────────────────────────────────────────────────

async function handleModal(interaction) {
  if (interaction.customId !== 'rp_role_modal') return;
  const { channelId, guildId } = interaction;
  const description = interaction.fields.getTextInputValue('rp_role_input');
  const displayName = interaction.member?.displayName || interaction.user.username;
  const session = getOrCreate(channelId, guildId);

  if (!session.isUserInQueue(interaction.user.id)) {
    return interaction.reply({ content: '❌ ต้องกดปุ่ม Join เพื่อเข้าคิวก่อน', ephemeral: true });
  }

  session.setUserRole(interaction.user.id, description);
  return interaction.reply({
    embeds: [{ title: '🎭 กำหนดบทบาทแล้ว', description: `**${displayName}** รับบทเป็น\n> ${description}`, color: 0x5865f2 }],
    ephemeral: true,
  });
}

module.exports = { handleRp, handleButton, handleSelect, handleModal };
