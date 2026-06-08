const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  PermissionFlagsBits,
  OverwriteType,
} = require('discord.js');

const vcManager = require('./vcManager');
const { buildVcPanel } = require('./panel');

// ─── Helper: owner-only guard ─────────────────────────────────────────────────

async function requireOwner(interaction) {
  const room = vcManager.getRoom(interaction.channelId);
  if (!room) {
    await interaction.reply({ content: '❌ ไม่พบห้องนี้ในระบบ ลองใช้ `/vc panel` ใหม่', ephemeral: true });
    return null;
  }
  if (room.ownerId !== interaction.user.id) {
    await interaction.reply({ content: '❌ เฉพาะเจ้าของห้องเท่านั้นที่ใช้ปุ่มนี้ได้', ephemeral: true });
    return null;
  }
  return room;
}

// ─── /vc slash command ────────────────────────────────────────────────────────

async function handleCommand(interaction) {
  const sub = interaction.options.getSubcommand();

  // /vc setup — admin only: เพิ่มห้อง "สร้างห้อง"
  if (sub === 'setup') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Channels** ถึงจะใช้คำสั่งนี้ได้', ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    vcManager.addJoinChannel(interaction.guildId, channel.id);

    const allIds = vcManager.getJoinChannels(interaction.guildId);
    const channelList = allIds.map((id) => `<#${id}>`).join('\n') || '-';
    const envValue   = allIds.join(',');

    return interaction.reply({
      embeds: [{
        title: '✅ ตั้งค่าสำเร็จ',
        description: `เพิ่ม ${channel} เป็นห้อง "สร้างห้อง" แล้ว\n\nวิธีใช้: ใครเข้าห้องนั้น → บอทสร้างห้องให้อัตโนมัติ ออกหมดแล้วก็ลบทิ้ง`,
        color: 0x57f287,
        fields: [
          { name: '📋 ห้องสร้างทั้งหมด', value: channelList, inline: false },
          {
            name: '🚀 คง config ข้าม Railway redeploy',
            value: `ตั้ง env var นี้ใน Railway service bot เพื่อไม่ให้หายเวลา redeploy:\n\`\`\`\nVC_JOIN_CHANNEL_IDS=${envValue}\n\`\`\``,
            inline: false,
          },
        ],
      }],
      ephemeral: true,
    });
  }

  // /vc remove — admin only: ลบห้อง "สร้างห้อง"
  if (sub === 'remove') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Channels** ถึงจะใช้คำสั่งนี้ได้', ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    vcManager.removeJoinChannel(interaction.guildId, channel.id);

    const remaining = vcManager.getJoinChannels(interaction.guildId);
    const channelList = remaining.map((id) => `<#${id}>`).join('\n') || '*(ไม่มีห้องที่ตั้งค่าไว้)*';

    return interaction.reply({
      embeds: [{
        title: '🗑️ ลบห้องสำเร็จ',
        description: `ลบ ${channel} ออกจากระบบแล้ว`,
        color: 0xe74c3c,
        fields: [{ name: '📋 ห้องที่เหลือ', value: channelList, inline: false }],
      }],
      ephemeral: true,
    });
  }

  // /vc list — admin only: ดูห้องทั้งหมด
  if (sub === 'list') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Channels** ถึงจะใช้คำสั่งนี้ได้', ephemeral: true });
    }
    const allIds = vcManager.getJoinChannels(interaction.guildId);
    const channelList = allIds.map((id) => `<#${id}>`).join('\n') || '*(ยังไม่ได้ตั้งค่าห้องใดเลย)*';

    return interaction.reply({
      embeds: [{
        title: '📋 ห้อง "สร้างห้อง" ทั้งหมด',
        description: channelList,
        color: 0x5865f2,
        footer: { text: `ทั้งหมด ${allIds.length} ห้อง · ใช้ /vc setup เพิ่ม, /vc remove ลบ` },
      }],
      ephemeral: true,
    });
  }

  // /vc panel — ส่ง panel ใหม่ (ถ้าแชทจม)
  if (sub === 'panel') {
    const room = vcManager.getRoom(interaction.channelId);
    if (!room) {
      return interaction.reply({
        content: '❌ คำสั่งนี้ใช้ได้เฉพาะใน voice channel ที่บอทสร้างให้เท่านั้น',
        ephemeral: true,
      });
    }
    return interaction.reply(buildVcPanel(interaction.channel, room.ownerId));
  }
}

// ─── Button handler ───────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const { customId, channelId } = interaction;

  // ── Rename → showModal (ต้องทำก่อน deferUpdate ใดๆ) ──
  if (customId === 'vc_rename') {
    const room = vcManager.getRoom(channelId);
    if (!room) return interaction.reply({ content: '❌ ไม่พบห้องในระบบ', ephemeral: true });
    if (room.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ เฉพาะเจ้าของห้องเท่านั้น', ephemeral: true });

    const modal = new ModalBuilder().setCustomId('vc_rename_modal').setTitle('✏️ เปลี่ยนชื่อห้อง');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('vc_rename_input')
          .setLabel('ชื่อห้องใหม่')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('เช่น 🎮 ห้องเล่นเกม')
          .setRequired(true)
          .setMaxLength(100)
      )
    );
    return interaction.showModal(modal);
  }

  // ── Limit → showModal ──
  if (customId === 'vc_limit') {
    const room = vcManager.getRoom(channelId);
    if (!room) return interaction.reply({ content: '❌ ไม่พบห้องในระบบ', ephemeral: true });
    if (room.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ เฉพาะเจ้าของห้องเท่านั้น', ephemeral: true });

    const modal = new ModalBuilder().setCustomId('vc_limit_modal').setTitle('🔢 จำกัดจำนวนคนในห้อง');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('vc_limit_input')
          .setLabel('จำนวนคนสูงสุด (0 = ไม่จำกัด, สูงสุด 99)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('เช่น 4')
          .setRequired(true)
          .setMaxLength(2)
      )
    );
    return interaction.showModal(modal);
  }

  // ── Kick → ephemeral select menu ──
  if (customId === 'vc_kick') {
    const room = await requireOwner(interaction);
    if (!room) return;

    const members = interaction.channel.members.filter((m) => m.id !== interaction.user.id);
    if (members.size === 0) {
      return interaction.reply({ content: '❌ ไม่มีคนอื่นในห้องตอนนี้', ephemeral: true });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('vc_kick_select')
      .setPlaceholder('เลือกคนที่จะ Kick ออก')
      .addOptions(members.map((m) => ({ label: m.displayName, value: m.id })));

    return interaction.reply({
      content: '👢 เลือกคนที่จะ Kick ออกจากห้อง:',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
  }

  // ── Allow → ephemeral UserSelectMenu ──
  if (customId === 'vc_allow') {
    const room = await requireOwner(interaction);
    if (!room) return;

    const select = new UserSelectMenuBuilder()
      .setCustomId('vc_allow_select')
      .setPlaceholder('เลือกคนที่ต้องการอนุญาตให้เข้าห้องได้')
      .setMinValues(1)
      .setMaxValues(1);

    return interaction.reply({
      content: '✅ เลือกคนที่ต้องการ **อนุญาต** ให้เข้าห้องได้ (กดซ้ำเพื่อยกเลิก):',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
  }

  // ── Block → ephemeral UserSelectMenu ──
  if (customId === 'vc_block') {
    const room = await requireOwner(interaction);
    if (!room) return;

    const select = new UserSelectMenuBuilder()
      .setCustomId('vc_block_select')
      .setPlaceholder('เลือกคนที่ต้องการบล็อก')
      .setMinValues(1)
      .setMaxValues(1);

    return interaction.reply({
      content: '🚫 เลือกคนที่ต้องการ **บล็อก** ออกจากห้อง (กดซ้ำเพื่อยกเลิก):',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
  }

  // ── Toggle Lock / Toggle Hide → deferUpdate + editReply ──
  const room = await requireOwner(interaction);
  if (!room) return;

  await interaction.deferUpdate();
  const channel = interaction.channel;

  try {
    if (customId === 'vc_toggle_lock') {
      const overwrite = channel.permissionOverwrites.cache.get(channel.guildId);
      const isLocked = overwrite?.deny.has(PermissionFlagsBits.Connect) ?? false;
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        Connect: isLocked ? null : false,   // null = reset to neutral (unlock), false = deny (lock)
      });
      console.log(`[VC] ${channel.id} ${isLocked ? 'unlocked' : 'locked'}`);
    } else if (customId === 'vc_toggle_hide') {
      const overwrite = channel.permissionOverwrites.cache.get(channel.guildId);
      const isHidden = overwrite?.deny.has(PermissionFlagsBits.ViewChannel) ?? false;
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        ViewChannel: isHidden ? null : false,
      });
      console.log(`[VC] ${channel.id} ${isHidden ? 'shown' : 'hidden'}`);
    }
  } catch (err) {
    console.error('[VC] Permission edit failed:', err.message);
  }

  // Re-fetch channel so permissionOverwrites.cache is fresh
  const updated = await channel.fetch();
  await interaction.editReply(buildVcPanel(updated, room.ownerId));
}

// ─── Select Menu handler ──────────────────────────────────────────────────────

async function handleSelect(interaction) {
  if (interaction.customId !== 'vc_kick_select') return;

  const room = vcManager.getRoom(interaction.channelId);
  if (!room || room.ownerId !== interaction.user.id) {
    return interaction.update({ content: '❌ เฉพาะเจ้าของห้องเท่านั้น', components: [] });
  }

  const targetId = interaction.values[0];
  try {
    const member = await interaction.guild.members.fetch(targetId);
    if (member.voice.channelId === interaction.channelId) {
      await member.voice.disconnect();
      return interaction.update({ content: `✅ Kick **${member.displayName}** ออกจากห้องแล้ว`, components: [] });
    } else {
      return interaction.update({ content: '❌ คนนั้นออกจากห้องไปแล้ว', components: [] });
    }
  } catch (err) {
    console.error('[VC] Kick failed:', err.message);
    return interaction.update({ content: '❌ Kick ไม่สำเร็จ ลองใหม่อีกครั้ง', components: [] });
  }
}

// ─── Helper: refresh panel after state change ─────────────────────────────────

async function refreshPanel(interaction) {
  const room = vcManager.getRoom(interaction.channelId);
  if (!room?.panelMessageId) return;
  try {
    const freshChannel = await interaction.channel.fetch();
    const panelMsg = await interaction.channel.messages.fetch(room.panelMessageId);
    await panelMsg.edit(buildVcPanel(freshChannel, room.ownerId));
  } catch (err) {
    console.error('[VC] refreshPanel failed:', err.message);
  }
}

// ─── Modal Submit handler ─────────────────────────────────────────────────────

async function handleModal(interaction) {
  const { customId, channelId } = interaction;

  const room = vcManager.getRoom(channelId);
  if (!room || room.ownerId !== interaction.user.id) {
    return interaction.reply({ content: '❌ เฉพาะเจ้าของห้องเท่านั้น', ephemeral: true });
  }

  const channel = interaction.channel;

  // ── Rename ──
  if (customId === 'vc_rename_modal') {
    const newName = interaction.fields.getTextInputValue('vc_rename_input').trim();
    try {
      await channel.setName(newName);
      await interaction.reply({ content: `✅ เปลี่ยนชื่อห้องเป็น **${newName}** แล้ว`, ephemeral: true });
      await refreshPanel(interaction);  // อัปเดต panel (แสดงชื่อใหม่ถ้ามีใน embed)
    } catch (err) {
      console.error('[VC] Rename failed:', err.message);
      await interaction.reply({ content: '❌ เปลี่ยนชื่อไม่สำเร็จ (Discord rate-limit ชื่อห้องได้แค่ 2 ครั้ง/10 นาที)', ephemeral: true });
    }
    return;
  }

  // ── Limit ──
  if (customId === 'vc_limit_modal') {
    const raw = interaction.fields.getTextInputValue('vc_limit_input').trim();
    const limit = parseInt(raw, 10);
    if (isNaN(limit) || limit < 0 || limit > 99) {
      return interaction.reply({ content: '❌ กรอกตัวเลข 0–99 เท่านั้น', ephemeral: true });
    }
    try {
      await channel.setUserLimit(limit);
      await interaction.reply({
        content: limit === 0
          ? '✅ ยกเลิกการจำกัดจำนวนคนแล้ว (ไม่จำกัด)'
          : `✅ จำกัดจำนวนคนเป็น **${limit} คน** แล้ว`,
        ephemeral: true,
      });
      await refreshPanel(interaction);  // อัปเดต panel แสดงจำนวนคนใหม่
    } catch (err) {
      console.error('[VC] Set limit failed:', err.message);
      await interaction.reply({ content: '❌ ตั้งค่าไม่สำเร็จ', ephemeral: true });
    }
    return;
  }
}

// ─── User Select Menu handler (Allow / Block) ─────────────────────────────────

async function handleUserSelect(interaction) {
  const { customId, channelId } = interaction;
  if (customId !== 'vc_allow_select' && customId !== 'vc_block_select') return;

  const room = vcManager.getRoom(channelId);
  if (!room || room.ownerId !== interaction.user.id) {
    return interaction.update({ content: '❌ เฉพาะเจ้าของห้องเท่านั้น', components: [] });
  }

  const targetId = interaction.values[0];
  if (targetId === interaction.user.id) {
    return interaction.update({ content: '❌ ไม่สามารถจัดการสิทธิ์ตัวเองได้', components: [] });
  }

  const channel = interaction.channel;

  try {
    const existing = channel.permissionOverwrites.cache.get(targetId);

    if (customId === 'vc_allow_select') {
      const alreadyAllowed = existing?.allow.has(PermissionFlagsBits.Connect) ?? false;
      if (alreadyAllowed) {
        // ยกเลิก allow
        await channel.permissionOverwrites.delete(targetId);
        await interaction.update({ content: `✅ ยกเลิกการอนุญาต <@${targetId}> แล้ว`, components: [] });
      } else {
        // อนุญาต — เข้าได้แม้ห้องล็อก
        await channel.permissionOverwrites.edit(targetId, {
          Connect: true,
          ViewChannel: true,
        });
        await interaction.update({ content: `✅ อนุญาต <@${targetId}> ให้เข้าห้องได้แล้ว`, components: [] });
      }
    } else {
      const alreadyBlocked = existing?.deny.has(PermissionFlagsBits.Connect) ?? false;
      if (alreadyBlocked) {
        // ยกเลิก block
        await channel.permissionOverwrites.delete(targetId);
        await interaction.update({ content: `✅ ยกเลิกการบล็อก <@${targetId}> แล้ว`, components: [] });
      } else {
        // บล็อก — ไม่เห็น ไม่เข้า
        await channel.permissionOverwrites.edit(targetId, {
          Connect: false,
          ViewChannel: false,
        });
        // kick ออกถ้ากำลังอยู่ในห้อง
        try {
          const member = await interaction.guild.members.fetch(targetId);
          if (member.voice.channelId === channelId) await member.voice.disconnect();
        } catch (_) {}
        await interaction.update({ content: `🚫 บล็อก <@${targetId}> ออกจากห้องแล้ว`, components: [] });
      }
    }

    // อัปเดต panel
    await refreshPanel(interaction);
  } catch (err) {
    console.error('[VC] handleUserSelect failed:', err.message);
    await interaction.update({ content: '❌ ดำเนินการไม่สำเร็จ ลองใหม่อีกครั้ง', components: [] });
  }
}

module.exports = { handleCommand, handleButton, handleSelect, handleUserSelect, handleModal };
