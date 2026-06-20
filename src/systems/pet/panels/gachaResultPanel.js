const { EmbedBuilder } = require('discord.js');
const { RARITY_LABEL, RARITY_COLOR } = require('./constants');
const catalog = require('../data/catalog.json');

const SPIN_EMOJIS = ['🐱', '🐺', '🦊', '🐉', '✨', '🐲', '🦅', '🐍', '🦁', '🐻'];

function frameSpinning() {
  const shuffled = [...SPIN_EMOJIS].sort(() => Math.random() - 0.5).slice(0, 6);
  return new EmbedBuilder()
    .setTitle('🎰 กำลังสุ่ม...')
    .setDescription(shuffled.join('  '))
    .setColor(0xff6b35);
}

function frameRevealing() {
  return new EmbedBuilder()
    .setTitle('🎰 เปิดผล...')
    .setDescription('✨ ✨ ✨')
    .setColor(0xfee75c);
}

function buildSingle(speciesId) {
  const sp = catalog[speciesId];
  const rarity = sp?.rarity || 'common';
  const label  = RARITY_LABEL[rarity] || rarity;
  const color  = RARITY_COLOR[rarity] || 0x5865f2;

  const embed = new EmbedBuilder()
    .setTitle('🎰 ผลการสุ่ม!')
    .setDescription(`${sp?.emoji || '🐾'} **${sp?.name || speciesId}**\n${label}`)
    .setColor(color);

  if (sp?.imageUrl) embed.setThumbnail(sp.imageUrl);

  return embed;
}

function buildMulti(results) {
  const lines = results.map((r, i) => {
    const sp = catalog[r.speciesId];
    const label = RARITY_LABEL[sp?.rarity] || '';
    return `${i + 1}. ${sp?.emoji || '🐾'} **${sp?.name || r.speciesId}**  ${label}`;
  });

  const bestRarity = getBestRarity(results);
  const color = RARITY_COLOR[bestRarity] || 0xff6b35;

  return new EmbedBuilder()
    .setTitle('🎰 ผลการสุ่ม 11 ตัว!')
    .setDescription(lines.join('\n'))
    .setColor(color);
}

function getBestRarity(results) {
  const order = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  for (const r of order) {
    if (results.some(res => {
      const sp = catalog[res.speciesId];
      return sp?.rarity === r || (sp?.gachaExclusive && r === 'legendary');
    })) return r;
  }
  return 'common';
}

module.exports = { frameSpinning, frameRevealing, buildSingle, buildMulti };
