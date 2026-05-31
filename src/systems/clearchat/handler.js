const { PermissionFlagsBits } = require('discord.js');

module.exports = async function handleClearchat(message) {
  if (!message.content.toLowerCase().startsWith('!clearchat')) return;

  if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return message.reply({ content: '❌ ต้องมีสิทธิ์ **Manage Messages** ถึงจะใช้คำสั่งนี้ได้' });
  }

  const args = message.content.trim().split(/\s+/);
  const amount = parseInt(args[1], 10);

  // !clearchat <number> — ลบ N ข้อความ (1–100)
  if (!isNaN(amount)) {
    if (amount < 1 || amount > 100) {
      return message.reply({ content: '❌ ระบุจำนวน 1–100 เท่านั้น' });
    }
    try {
      // +1 เพื่อรวมข้อความคำสั่งด้วย
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

  // !clearchat — ลบทั้งหมดในช่อง (สูงสุด 100 ครั้ง × 100 ข้อความ)
  try {
    await message.delete().catch(() => {});
    let totalDeleted = 0;
    let fetched;
    do {
      fetched = await message.channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      const bulk = await message.channel.bulkDelete(fetched, true);
      totalDeleted += bulk.size;
    } while (fetched.size >= 2);

    const confirm = await message.channel.send(`🗑️ ล้างแชทเสร็จ ลบทั้งหมด **${totalDeleted}** ข้อความ`);
    setTimeout(() => confirm.delete().catch(() => {}), 4000);
  } catch (err) {
    console.error('[clearchat] full clear failed:', err.message);
    message.channel.send('❌ ลบไม่สำเร็จ ลองใหม่อีกครั้ง').catch(() => {});
  }
};
