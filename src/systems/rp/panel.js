const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

// ─── Labels ───────────────────────────────────────────────────────────────────

const WORLD_LABELS = {
  dungeon: '🏚️ ดันเจี้ยนโบราณ',
  forest: '🌲 ป่าลึกลับ',
  city: '🏙️ เมือง Valdris',
  tavern: '🍺 โรงเตี๊ยม Crooked Lantern',
};

const CHAR_LABELS = {
  narrator: '📖 ผู้บรรยาย',
  villain: '🗡️ เซราธ (ผู้ร้าย)',
  mentor: '🧙 เวล (พี่เลี้ยง)',
  rival: '⚔️ คิรา (คู่แข่ง)',
};

// ─── Panel Builder ────────────────────────────────────────────────────────────

function buildPanel(session, status = null) {
  const isActive = session?.active ?? false;

  const embed = {
    title: '🎮 RP Control Panel',
    color: isActive ? 0x57f287 : 0x5865f2,
    fields: [
      {
        name: '📊 สถานะ',
        value: !session ? '⚫ ยังไม่มี session' : isActive ? '🟢 กำลังเล่น' : '🔴 หยุดอยู่',
        inline: true,
      },
      {
        name: '👥 ผู้เล่น',
        value: session
          ? `${session.queue.length}${session.maxPlayers > 0 ? `/${session.maxPlayers}` : ''}`
          : '0',
        inline: true,
      },
      {
        name: '💬 รอบสนทนา',
        value: session ? `${Math.floor(session.conversationHistory.length / 2)}` : '0',
        inline: true,
      },
      {
        name: '🗺️ ฉาก',
        value: session?.worldName
          ? WORLD_LABELS[session.worldName] ?? session.worldName
          : '*(ยังไม่ได้เลือก)*',
        inline: true,
      },
      {
        name: '🎭 ตัวละคร',
        value: session?.charName
          ? CHAR_LABELS[session.charName] ?? session.charName
          : '*(ยังไม่ได้เลือก)*',
        inline: true,
      },
      {
        name: '▶️ คิวปัจจุบัน',
        value: isActive && session.currentUser ? `<@${session.currentUser.userId}>` : '—',
        inline: true,
      },
    ],
    footer: { text: 'ใช้ปุ่มด้านล่างเพื่อควบคุม session' },
    timestamp: new Date().toISOString(),
  };

  if (status) {
    embed.fields.push({ name: '⚡ ผลลัพธ์', value: status, inline: false });
  }

  // Row 1 — Player actions
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rp_join').setLabel('Join').setEmoji('🟢').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('rp_leave').setLabel('Leave').setEmoji('🔴').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('rp_queue').setLabel('Queue').setEmoji('📋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rp_role').setLabel('Set Role').setEmoji('🎭').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('rp_info').setLabel('Info').setEmoji('📊').setStyle(ButtonStyle.Secondary),
  );

  // Row 2 — World select
  const row2 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rp_world_select')
      .setPlaceholder('🗺️ เลือกฉาก (Layer 2)')
      .addOptions([
        { label: '🏚️ Dungeon — ดันเจี้ยนโบราณ', value: 'dungeon', default: session?.worldName === 'dungeon' },
        { label: '🌲 Forest — ป่าลึกลับ', value: 'forest', default: session?.worldName === 'forest' },
        { label: '🏙️ City — เมือง Valdris', value: 'city', default: session?.worldName === 'city' },
        { label: '🍺 Tavern — โรงเตี๊ยม Crooked Lantern', value: 'tavern', default: session?.worldName === 'tavern' },
      ])
  );

  // Row 3 — Character select
  const row3 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('rp_char_select')
      .setPlaceholder('🎭 เลือกตัวละคร AI (Layer 3)')
      .addOptions([
        { label: '📖 Narrator — ผู้บรรยายรอบรู้', value: 'narrator', default: session?.charName === 'narrator' },
        { label: '🗡️ Villain — เซราธ ผู้ร้ายที่ซับซ้อน', value: 'villain', default: session?.charName === 'villain' },
        { label: '🧙 Mentor — เวล พี่เลี้ยงผู้ผ่านโลก', value: 'mentor', default: session?.charName === 'mentor' },
        { label: '⚔️ Rival — คิรา คู่แข่งที่ห่วงใย', value: 'rival', default: session?.charName === 'rival' },
      ])
  );

  // Row 4 — Session control
  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rp_start').setLabel('Start').setEmoji('▶️').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('rp_stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('rp_skip').setLabel('Skip Turn').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rp_reset').setLabel('Reset').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('rp_clear').setLabel('Clear All').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row1, row2, row3, row4] };
}

module.exports = { buildPanel, WORLD_LABELS, CHAR_LABELS };
