const { EmbedBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR, RARITY_BADGE } = require('./constants');
const catalog = require('../data/catalog.json');

const SPIN_FRAMES = [
  ['🐱', '🐺', '🦊', '🐉', '✨', '🐲'],
  ['🦅', '🐍', '🦁', '🐻', '💎', '🔥'],
  ['⚡', '🌙', '🗿', '🌌', '🦑', '⛓️'],
];

function frameSpinning() {
  const frame = SPIN_FRAMES[Math.floor(Math.random() * SPIN_FRAMES.length)];
  const shuffled = [...frame].sort(() => Math.random() - 0.5);
  return new EmbedBuilder()
    .setTitle('🎰 กำลังสุ่ม...')
    .setDescription(`\n${shuffled.join('  →  ')}\n`)
    .setColor(0xff6b35);
}

function frameRevealing() {
  return new EmbedBuilder()
    .setTitle('✨ เปิดผล... ✨')
    .setDescription('\n⬇️  ⬇️  ⬇️\n')
    .setColor(0xfee75c);
}

function buildSingle(speciesId) {
  const sp = catalog[speciesId];
  const rarity = sp?.rarity || 'common';
  const color  = RARITY_COLOR[rarity] || 0x5865f2;

  const embed = new EmbedBuilder()
    .setTitle('🎰 ผลการสุ่ม!')
    .setDescription(
      `\n${sp?.emoji || '🐾'} **${sp?.name || speciesId}**\n` +
      `${RARITY_LABEL[rarity]}\n`
    )
    .setColor(color);

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);
  if (rarity === 'legendary' || rarity === 'mythic') {
    embed.setFooter({ text: '🎉 ยินดีด้วย! ได้สัตว์หายาก!' });
  }

  return embed;
}

function buildMulti(results) {
  const lines = results.map((r, i) => {
    const sp    = catalog[r.speciesId];
    const badge = RARITY_BADGE[sp?.rarity] || '⚪';
    return `\`${String(i + 1).padStart(2)}\`  ${badge} ${sp?.emoji || '🐾'} **${sp?.name || r.speciesId}**`;
  });

  const bestRarity = getBestRarity(results);
  const color = RARITY_COLOR[bestRarity] || 0xff6b35;

  const embed = new EmbedBuilder()
    .setTitle('🎰 ผลการสุ่ม ×11!')
    .setDescription(lines.join('\n'))
    .setColor(color);

  const rareCount = results.filter(r => {
    const sp = catalog[r.speciesId];
    return ['epic', 'legendary', 'mythic'].includes(sp?.rarity);
  }).length;

  if (rareCount > 0) {
    embed.setFooter({ text: `🎉 ได้สัตว์ระดับ Epic ขึ้นไป ${rareCount} ตัว!` });
  }

  return embed;
}

function getBestRarity(results) {
  const order = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  for (const r of order) {
    if (results.some(res => catalog[res.speciesId]?.rarity === r)) return r;
  }
  return 'common';
}

module.exports = { frameSpinning, frameRevealing, buildSingle, buildMulti };
