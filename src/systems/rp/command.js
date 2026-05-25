const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rp')
    .setDescription('ระบบโรลเพลย์ AI — จัดคิวและสนทนากับ AI')
    .addSubcommand((sub) =>
      sub.setName('join').setDescription('เข้าร่วมคิวโรลเพลย์')
    )
    .addSubcommand((sub) =>
      sub.setName('leave').setDescription('ออกจากคิว')
    )
    .addSubcommand((sub) =>
      sub.setName('queue').setDescription('ดูรายชื่อและลำดับคิว')
    )
    .addSubcommand((sub) =>
      sub
        .setName('role')
        .setDescription('กำหนดบทบาทตัวละครของคุณ')
        .addStringOption((opt) =>
          opt
            .setName('description')
            .setDescription('บรรยายตัวละครของคุณ เช่น นักดาบสาวผู้ผ่านสงครามมามาก')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('world')
        .setDescription('[Layer 2] เลือกฉากและโลกของเรื่อง')
        .addStringOption((opt) =>
          opt
            .setName('preset')
            .setDescription('เลือกฉากจาก preset ที่มี')
            .setRequired(true)
            .addChoices(
              { name: '🏚️ Dungeon — ดันเจี้ยนโบราณ', value: 'dungeon' },
              { name: '🌲 Forest — ป่าลึกลับ', value: 'forest' },
              { name: '🏙️ City — เมืองแฟนตาซี Valdris', value: 'city' },
              { name: '🍺 Tavern — โรงเตี๊ยม Crooked Lantern', value: 'tavern' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('char')
        .setDescription('[Layer 3] เลือกตัวละครหลักที่ AI สวมบทบาท')
        .addStringOption((opt) =>
          opt
            .setName('preset')
            .setDescription('เลือกตัวละครจาก preset ที่มี')
            .setRequired(true)
            .addChoices(
              { name: '📖 Narrator — ผู้บรรยายรอบรู้', value: 'narrator' },
              { name: '🗡️ Villain — เซราธ ผู้ร้ายที่ซับซ้อน', value: 'villain' },
              { name: '🧙 Mentor — เวล พี่เลี้ยงผู้ผ่านโลก', value: 'mentor' },
              { name: '⚔️ Rival — คิรา คู่แข่งที่ห่วงใย', value: 'rival' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('setmax')
        .setDescription('กำหนดจำนวนผู้เล่นสูงสุด (0 = ไม่จำกัด)')
        .addIntegerOption((opt) =>
          opt
            .setName('players')
            .setDescription('จำนวนผู้เล่นสูงสุด (0 = ไม่จำกัด)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(20)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('start').setDescription('เริ่มเซสชันโรลเพลย์')
    )
    .addSubcommand((sub) =>
      sub.setName('stop').setDescription('หยุดเซสชันโรลเพลย์')
    )
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('ดูสถานะเซสชันปัจจุบัน')
    )
    .addSubcommand((sub) =>
      sub.setName('skip').setDescription('ข้ามเทิร์นของผู้เล่นปัจจุบัน (admin)')
    )
    .addSubcommand((sub) =>
      sub.setName('reset').setDescription('รีเซ็ตประวัติการสนทนา (คิวยังอยู่)')
    )
    .addSubcommand((sub) =>
      sub.setName('clear').setDescription('ล้างทุกอย่าง: คิว + ประวัติ + เซสชัน')
    )
    .addSubcommand((sub) =>
      sub.setName('open').setDescription('🎮 เปิด RP Control Panel — ปุ่มควบคุมทั้งหมดในที่เดียว')
    ),
};
