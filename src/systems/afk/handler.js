const {
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require('@discordjs/voice');

// Map<guildId, VoiceConnection>
const afkConnections = new Map();

module.exports = async function handleAfk(message) {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('!afk')) return;

  const guild = message.guild;
  if (!guild) return;

  // ── Toggle off: บอทออกจาก VC ──
  if (afkConnections.has(guild.id)) {
    afkConnections.get(guild.id).destroy();
    afkConnections.delete(guild.id);
    await message.react('👋');
    return;
  }

  // ── ตรวจว่า user อยู่ใน VC ──
  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    return message.reply({ content: '❌ เข้า voice channel ก่อนแล้วค่อยพิมพ์ `!afk`' });
  }

  // ── Toggle on: บอทเข้า VC ──
  const connection = joinVoiceChannel({
    channelId:      voiceChannel.id,
    guildId:        guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf:       false,
    selfMute:       true,
  });

  afkConnections.set(guild.id, connection);

  // ถ้าบอทถูก kick หรือ disconnect โดยไม่ได้สั่ง → เคลียร์ map
  connection.on(VoiceConnectionStatus.Disconnected, () => {
    afkConnections.delete(guild.id);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    afkConnections.delete(guild.id);
  });

  await message.react('🔊');
};
