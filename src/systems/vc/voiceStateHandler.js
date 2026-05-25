const { ChannelType, PermissionFlagsBits } = require('discord.js');
const vcManager = require('./vcManager');
const { buildVcPanel } = require('./panel');

// ─── Main handler ─────────────────────────────────────────────────────────────

module.exports = async function vcVoiceStateHandler(oldState, newState) {
  // User joined a channel (or moved to a different one)
  if (newState.channelId && newState.channelId !== oldState.channelId) {
    if (vcManager.isJoinChannel(newState.guild.id, newState.channelId)) {
      await handleJoinToCreate(newState);
    }
  }

  // User left a channel
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    if (vcManager.isManagedChannel(oldState.channelId)) {
      await handleLeave(oldState);
    }
  }
};

// ─── สร้างห้องใหม่ ────────────────────────────────────────────────────────────

async function handleJoinToCreate(state) {
  const member = state.member;
  const guild = state.guild;
  const joinChannel = guild.channels.cache.get(state.channelId);

  // ─── ตั้งชื่อห้องจากชื่อ join channel: ตัด "สร้างห้อง" แล้วต่อ "ของ {username}" ───
  // ตัวอย่าง: "สร้างห้องเล่นเกมดีหว่าา" → "เล่นเกมดีหว่าา ของ Pd.Gee"
  const rawName = (joinChannel?.name ?? '').trim();
  const baseName = rawName.replace(/^สร้างห้อง\s*/u, '').trim();
  const roomName = baseName
    ? `${baseName} ของ ${member.displayName}`
    : `ห้องของ ${member.displayName}`;

  try {
    // Create voice channel in the same category as the "join to create" channel
    const newChannel = await guild.channels.create({
      name: roomName,
      type: ChannelType.GuildVoice,
      parent: joinChannel?.parentId ?? null,
      permissionOverwrites: [
        // เฉพาะ owner: Allow Connect + ViewChannel (ล็อก/ซ่อนก็ยังเข้าได้)
        {
          id: member.id,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    vcManager.registerRoom(newChannel.id, member.id, guild.id);

    // ย้าย user เข้าห้องใหม่
    await member.voice.setChannel(newChannel);

    // ส่ง control panel ไปที่ text chat ในห้อง voice
    const panelMsg = await newChannel.send({
      content: `<@${member.id}> ห้องของคุณพร้อมแล้ว! ใช้ปุ่มด้านล่างจัดการห้องได้เลย 🎙️`,
      ...buildVcPanel(newChannel, member.id),
    });
    vcManager.setPanelMessage(newChannel.id, panelMsg.id);

    console.log(`[VC] Created room "${newChannel.name}" (${newChannel.id}) for ${member.displayName}`);
  } catch (err) {
    console.error('[VC] Failed to create room:', err.message);
  }
}

// ─── ลบห้องว่าง ───────────────────────────────────────────────────────────────

async function handleLeave(state) {
  try {
    const channel = state.guild.channels.cache.get(state.channelId);
    if (channel && channel.members.size === 0) {
      vcManager.unregisterRoom(state.channelId);
      await channel.delete('VC auto-delete: room is empty');
      console.log(`[VC] Deleted empty room ${state.channelId}`);
    }
  } catch (err) {
    console.error('[VC] Failed to delete room:', err.message);
  }
}
