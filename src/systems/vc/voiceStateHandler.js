const { ChannelType, PermissionFlagsBits } = require('discord.js');
const vcManager = require('./vcManager');
const { buildVcPanel } = require('./panel');

// ─── Main handler ─────────────────────────────────────────────────────────────

module.exports = async function vcVoiceStateHandler(oldState, newState) {
  // User joined a channel (or moved to a different one)
  if (newState.channelId && newState.channelId !== oldState.channelId) {
    const joinChannelId = vcManager.getJoinChannel(newState.guild.id);
    if (joinChannelId && newState.channelId === joinChannelId) {
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

// ─── Create new room ──────────────────────────────────────────────────────────

async function handleJoinToCreate(state) {
  const member = state.member;
  const guild = state.guild;
  const joinChannel = guild.channels.cache.get(state.channelId);

  try {
    // Create voice channel in the same category as the "join to create" channel
    const newChannel = await guild.channels.create({
      name: `🔊-⋆⑅˚₊ห้องแหกปากของ ${member.displayName}`,
      type: ChannelType.GuildVoice,
      parent: joinChannel?.parentId ?? null,
      permissionOverwrites: [
        // ไม่ copy overwrites จาก join channel เพื่อป้องกัน role อื่นที่มี Connect:Allow
        // ทำให้ตอน lock (@everyone: Connect:DENY) ทำงานได้จริง
        // ห้องนี้ inherit permission จาก category เหมือนปกติ
        // เฉพาะ owner ที่ได้รับ Allow ชัดเจน (ล็อก/ซ่อนก็ยังเข้าได้)
        {
          id: member.id,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    vcManager.registerRoom(newChannel.id, member.id, guild.id);

    // Move user into the new channel
    await member.voice.setChannel(newChannel);

    // Send control panel to the voice channel's built-in text chat
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

// ─── Delete empty room ────────────────────────────────────────────────────────

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
