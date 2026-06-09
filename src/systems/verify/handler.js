const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

const verifyManager = require('./verifyManager');

// Temp storage ระหว่าง slash command → modal submit
// Map<userId, { roleId, buttonLabel, minDays, channelId, guildId }>
const pendingSetups = new Map();

// ─── /verify command ──────────────────────────────────────────────────────────

async function handleCommand(interaction) {
  const sub = interaction.options.getSubcommand();

  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Roles** ถึงจะใช้คำสั่งนี้ได้', ephemeral: true });
  }

  // /verify setup → เก็บ config ไว้ชั่วคราว แล้วเปิด Modal กรอกข้อความ
  if (sub === 'setup') {
    const role      = interaction.options.getRole('role');
    const button    = interaction.options.getString('button');
    const minDays   = interaction.options.getInteger('min_days') ?? 30;

    pendingSetups.set(interaction.user.id, {
      roleId:      role.id,
      buttonLabel: button,
      minDays,
      channelId:   interaction.channelId,
      guildId:     interaction.guildId,
    });

    const modal = new ModalBuilder()
      .setCustomId('verify_setup_modal')
      .setTitle('ข้อความยืนยันสมาชิก');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('verify_msg_input')
          .setLabel('ข้อความ (กด Enter เพื่อขึ้นบรรทัดใหม่)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1500)
          .setPlaceholder(
            'เช่น\n✦ ยินดีต้อนรับ!\n✦ กรุณาอ่านกฎก่อนกดปุ่ม\nกด Accept เพื่อเข้าร่วม'
          )
      )
    );

    return interaction.showModal(modal);
  }

  // /verify send → ส่ง verify message ใหม่ด้วย config เดิม
  if (sub === 'send') {
    const config = verifyManager.getConfig(interaction.guildId);
    if (!config) {
      return interaction.reply({
        content: '❌ ยังไม่ได้ตั้งค่า ใช้ `/verify setup` ก่อน',
        ephemeral: true,
      });
    }
    await sendVerifyMessage(interaction.channel, config);
    return interaction.reply({ content: '✅ ส่งข้อความยืนยันแล้ว', ephemeral: true });
  }
}

// ─── Modal submit ─────────────────────────────────────────────────────────────

async function handleModal(interaction) {
  if (interaction.customId !== 'verify_setup_modal') return;

  const pending = pendingSetups.get(interaction.user.id);
  if (!pending) {
    return interaction.reply({
      content: '❌ หมดเวลา กรุณาใช้ `/verify setup` ใหม่',
      ephemeral: true,
    });
  }
  pendingSetups.delete(interaction.user.id);

  const message = interaction.fields.getTextInputValue('verify_msg_input');

  const config = {
    message,
    buttonLabel: pending.buttonLabel,
    roleId:      pending.roleId,
    minDays:     pending.minDays,
  };

  verifyManager.setConfig(pending.guildId, config);

  const channel = interaction.client.channels.cache.get(pending.channelId);
  if (channel) {
    await sendVerifyMessage(channel, config);
    return interaction.reply({ content: '✅ บันทึกและส่งข้อความยืนยันแล้ว', ephemeral: true });
  }

  return interaction.reply({
    content: '✅ บันทึกแล้ว ใช้ `/verify send` เพื่อส่งข้อความ',
    ephemeral: true,
  });
}

// ─── Button: verify_claim ─────────────────────────────────────────────────────

async function handleButton(interaction) {
  if (interaction.customId !== 'verify_claim') return;

  const config = verifyManager.getConfig(interaction.guildId);
  if (!config) {
    return interaction.reply({ content: '❌ ระบบ verify ยังไม่ได้ตั้งค่า', ephemeral: true });
  }

  // มี role แล้ว
  if (interaction.member.roles.cache.has(config.roleId)) {
    return interaction.reply({ content: '✅ คุณได้รับ role นี้แล้ว', ephemeral: true });
  }

  // เช็คอายุบัญชี
  const ageDays = Math.floor((Date.now() - interaction.user.createdTimestamp) / 86_400_000);
  if (ageDays < config.minDays) {
    return interaction.reply({
      content: `❌ บัญชีของคุณอายุ **${ageDays} วัน** — ต้องการอย่างน้อย **${config.minDays} วัน** ถึงจะยืนยันได้`,
      ephemeral: true,
    });
  }

  // ให้ role
  try {
    await interaction.member.roles.add(config.roleId);
    return interaction.reply({
      content: `✅ ยืนยันสำเร็จ! คุณได้รับ <@&${config.roleId}> แล้ว 🎉`,
      ephemeral: true,
    });
  } catch (err) {
    console.error('[verify] add role failed:', err.message);
    return interaction.reply({
      content: '❌ ให้ role ไม่สำเร็จ — ตรวจสอบว่า role ของบอทอยู่เหนือ role ที่จะให้',
      ephemeral: true,
    });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function sendVerifyMessage(channel, config) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_claim')
      .setLabel(config.buttonLabel)
      .setStyle(ButtonStyle.Primary),
  );

  return channel.send({
    embeds: [{
      description: config.message,
      color: 0x5865f2,
      footer: { text: `ต้องการบัญชีอายุอย่างน้อย ${config.minDays} วัน` },
    }],
    components: [row],
  });
}

module.exports = { handleCommand, handleButton, handleModal };
