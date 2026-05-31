const { PermissionFlagsBits } = require('discord.js');

// Map<channelId, true> — ช่องที่กำลังลบอยู่
const activeClears = new Map();

module.exports = async function handleClearchat(message) {
  if (!message.content.toLowerCase().startsWith('!clearchat')) return;

  if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return message.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Messages** ถึงจะใช้คำสั่งนี้ได้' });
  }

  const args = message.content.trim().split(/\s+/);
  const sub = args[1]?.toLowerCase();

  // !clearchat stop — หยุดกลางทาง
  if (sub === 'stop') {
    if (!activeClears.has(message.channelId)) {
      return message.reply({ content: '❌ ไม่มีการล้างแชทที่กำลังทำงานอยู่' });
    }
    activeClears.delete(message.channelId);
    return message.react('🛑');
  }

  const amount = parseInt(sub, 10);

  // !clearchat <number> — ลบ N ข้อความ (1–100)
  if (!isNaN(amount)) {
    if (amount < 1 || amount > 100) {
      return message.reply({ content: '❌ ระบุจำนวน 1–100 เท่านั้น' });
    }
    try {
      const deleted = await message.channel.bulkDelete(amount + 1, true);
      const count = deleted.size - 1;
      const confirm = await message.channel.send(`🗑️ ลบ **${count}** ข้อความแล้ว`);
      setTimeout(() => confirm.delete().catch(() => {}), 3000);
    } catch (err) {
      console.error('[clearchat] bulkDelete failed:', err.message);
      message.reply({ content: '❌ ลบไม่สำเร็จ (ข้อความเกิน 14 วันลบ bulk ไม่ได้)' });
    }
    return;
  }

  // !clearchat — ลบทั้งหมดในช่อง
  if (activeClears.has(message.channelId)) {
    return message.reply({ content: '⚠️ กำลังล้างแชทอยู่แล้ว ใช้ `!clearchat stop` เพื่อหยุด' });
  }

  activeClears.set(message.channelId, true);
  try {
    await message.delete().catch(() => {});
    let totalDeleted = 0;
    let fetched;
    do {
      if (!activeClears.has(message.channelId)) {
        const stopped = await message.channel.send(`🛑 หยุดล้างแชท — ลบไปแล้ว **${totalDeleted}** ข้อความ`);
        setTimeout(() => stopped.delete().catch(() => {}), 4000);
        return;
      }
      fetched = await message.channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      const bulk = await message.channel.bulkDelete(fetched, true);
      totalDeleted += bulk.size;
    } while (fetched.size >= 2);

    activeClears.delete(message.channelId);
    const confirm = await message.channel.send(`🗑️ ล้างแชทเสร็จ ลบทั้งหมด **${totalDeleted}** ข้อความ`);
    setTimeout(() => confirm.delete().catch(() => {}), 4000);
  } catch (err) {
    activeClears.delete(message.channelId);
    console.error('[clearchat] full clear failed:', err.message);
    message.channel.send('❌ ลบไม่สำเร็จ ลองใหม่อีกครั้ง').catch(() => {});
  }
};
