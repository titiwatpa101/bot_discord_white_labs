const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '../../prompts');

function load(rel) {
  const p = path.join(BASE, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8').trim() : null;
}

function list(subdir) {
  const dir = path.join(BASE, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => f.slice(0, -4));
}

module.exports = {
  systemCore: () => load('system_core.txt') ?? '',
  world: (name) => load(`worlds/${name}.txt`),
  character: (name) => load(`characters/${name}.txt`),
  listWorlds: () => list('worlds'),
  listChars: () => list('characters'),
};
