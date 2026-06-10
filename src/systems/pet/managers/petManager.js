const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/users.json');

const FOOD_CATALOG = {
  food_basic: { name: 'หญ้าธรรมดา 🌿', price: 10,  exp: 10  },
  food_meat:  { name: 'เนื้อสด 🍖',    price: 50,  exp: 50  },
  food_ultra: { name: 'อาหารพิเศษ ✨', price: 200, exp: 200 },
};

function load() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}

function save(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function key(guildId, userId) { return `${guildId}_${userId}`; }

function getUser(guildId, userId) {
  const data = load();
  const k    = key(guildId, userId);
  if (!data[k]) {
    data[k] = { coins: 0, food: { food_basic: 0, food_meat: 0, food_ultra: 0 }, pets: [] };
    save(data);
  }
  return data[k];
}

function saveUser(guildId, userId, user) {
  const data = load();
  data[key(guildId, userId)] = user;
  save(data);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addPet(guildId, userId, speciesId) {
  const user = getUser(guildId, userId);
  const pet  = { instanceId: genId(), speciesId, level: 1, exp: 0 };
  user.pets.push(pet);
  saveUser(guildId, userId, user);
  return pet;
}

function removePet(guildId, userId, instanceId) {
  const user = getUser(guildId, userId);
  const idx  = user.pets.findIndex(p => p.instanceId === instanceId);
  if (idx === -1) return null;
  const [pet] = user.pets.splice(idx, 1);
  saveUser(guildId, userId, user);
  return pet;
}

function setActive(guildId, userId, instanceId) {
  const user = getUser(guildId, userId);
  const idx  = user.pets.findIndex(p => p.instanceId === instanceId);
  if (idx === -1) return false;
  const [pet] = user.pets.splice(idx, 1);
  user.pets.unshift(pet);
  saveUser(guildId, userId, user);
  return true;
}

function expToNext(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function expBar(exp, level, width = 10) {
  const needed  = expToNext(level);
  const filled  = Math.round((exp / needed) * width);
  const clamped = Math.min(width, Math.max(0, filled));
  return '█'.repeat(clamped) + '░'.repeat(width - clamped);
}

function addExp(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  if (!user.pets.length) return null;
  const pet    = user.pets[0];
  pet.exp     += amount;
  let leveled  = false;
  while (pet.exp >= expToNext(pet.level)) {
    pet.exp   -= expToNext(pet.level);
    pet.level += 1;
    leveled    = true;
  }
  saveUser(guildId, userId, user);
  return { pet, leveled };
}

function addCoins(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  user.coins = Math.max(0, (user.coins || 0) + amount);
  saveUser(guildId, userId, user);
  return user.coins;
}

function addFood(guildId, userId, foodId, qty) {
  const user = getUser(guildId, userId);
  user.food[foodId] = (user.food[foodId] || 0) + qty;
  saveUser(guildId, userId, user);
}

function useFood(guildId, userId, foodId) {
  const user = getUser(guildId, userId);
  if (!user.food[foodId] || user.food[foodId] <= 0) return false;
  user.food[foodId]--;
  saveUser(guildId, userId, user);
  return true;
}

function totalFood(user) {
  return Object.values(user.food).reduce((s, n) => s + n, 0);
}

module.exports = {
  getUser, saveUser, addPet, removePet, setActive,
  addExp, expToNext, expBar, addCoins, addFood, useFood, totalFood,
  FOOD_CATALOG,
};
