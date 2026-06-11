const fs   = require('fs');
const path = require('path');

const DATA_PATH  = path.join(__dirname, '../data/market.json');
const USERS_PATH = path.join(__dirname, '../data/users.json');
const catalog    = require('../data/catalog.json');

const RARITY_MUL = { legendary: 5, epic: 2.5, rare: 1.5, uncommon: 1.1, common: 1.0 };

const EVENTS = [
  { desc: '🔥 นักล่าออกตามหามังกร! ราคาพุ่ง',       speciesId: 'dragon_fire',    demandBoost:  0.40, duration: 2 },
  { desc: '📦 พ่อค้าขนแมวส้มมาเยอะ ราคาดิ่ง',       speciesId: 'cat_orange',     supplyShock: -0.30, duration: 3 },
  { desc: '🌊 ผีเสื้อน้ำแข็งหายากขึ้น!',             speciesId: 'butterfly_ice',  demandBoost:  0.30, duration: 2 },
  { desc: '🌕 จิ้งจอกวิญญาณออกเดินในคืนพระจันทร์',  speciesId: 'fox_spirit',     demandBoost:  0.25, duration: 4 },
  { desc: '🐺 ฝูงหมาป่าพบในป่า ตลาดตื่นตัว',        speciesId: 'wolf_shadow',    demandBoost:  0.35, duration: 2 },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

function load() {
  if (!fs.existsSync(DATA_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch { return {}; }
}

function save(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }

function getGuild(guildId) {
  const data = load();
  if (!data[guildId]) {
    data[guildId] = {
      panelChannelId: null, panelMessageId: null,
      listings: [],
      prices: {}, priceHistory: {}, ema: {}, tradeImpact: {},
      activeEvent: null, nextEventAt: Date.now() + randBetween(6, 12) * 3600_000,
    };
    save(data);
  }
  return data[guildId];
}

function saveGuild(guildId, g) {
  const data = load();
  data[guildId] = g;
  save(data);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randBetween(a, b) { return a + Math.random() * (b - a); }

function gaussianRandom(mean, std) {
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function getPriceAt(history, ts) {
  const entries = history.filter(h => h.t <= ts);
  return entries.length ? entries[entries.length - 1].p : null;
}

function countUniqueOwners(guildId, speciesId) {
  try {
    if (!fs.existsSync(USERS_PATH)) return 1;
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    const n = Object.entries(users)
      .filter(([k]) => k.startsWith(guildId + '_'))
      .filter(([, u]) => u.pets.some(p => p.speciesId === speciesId))
      .length;
    return Math.max(1, n);
  } catch { return 1; }
}

// ─── Price Engine ─────────────────────────────────────────────────────────────

function initPrice(g, speciesId) {
  const sp = catalog[speciesId];
  if (!g.prices[speciesId]) g.prices[speciesId] = { value: sp.basePrice, updatedAt: Date.now() };
  if (!g.ema[speciesId])    g.ema[speciesId]    = { buy: 0, sell: 0 };
  if (!g.priceHistory[speciesId]) g.priceHistory[speciesId] = [];
}

function computeNewPrice(g, guildId, speciesId) {
  const sp = catalog[speciesId];
  initPrice(g, speciesId);

  const base      = sp.basePrice;
  const fairValue = base * (RARITY_MUL[sp.rarity] || 1);
  const now       = Date.now();

  // S — supply factor
  const supply    = Math.max(1, g.listings.filter(l => l.speciesId === speciesId).length);
  const S         = Math.pow(5 / supply, sp.elasticity);

  // D — demand pressure via EMA (tanh-capped)
  const ema       = g.ema[speciesId];
  const netFlow   = ema.buy - ema.sell;
  const D         = 1 + Math.tanh(netFlow / 3);

  // M — momentum from 1h + 24h price change
  const history   = g.priceHistory[speciesId];
  const cur       = g.prices[speciesId].value;
  const p1h       = getPriceAt(history, now - 3_600_000)  || base;
  const p24h      = getPriceAt(history, now - 86_400_000) || base;
  const rawM      = 1 + 0.4 * ((cur - p1h) / p1h) + 0.15 * ((cur - p24h) / p24h);
  const M         = Math.min(1.25, Math.max(0.75, rawM));

  // L — liquidity premium
  const owners    = countUniqueOwners(guildId, speciesId);
  const L         = 1 + (8 / (owners + 4)) * 0.12;

  // R — mean reversion
  const deviation = (cur - fairValue) / fairValue;
  const R         = Math.exp(-0.25 * deviation);

  // V — volatility noise (grows with inactivity)
  const hoursIdle = (now - g.prices[speciesId].updatedAt) / 3_600_000;
  const sigma     = sp.baseVolatility * Math.sqrt(hoursIdle + 1);
  const V         = 1 + gaussianRandom(0, sigma);

  // Event modifier
  let E = 1;
  if (g.activeEvent?.speciesId === speciesId && g.activeEvent.expiresAt > now) {
    E = 1 + (g.activeEvent.demandBoost || 0) + (g.activeEvent.supplyShock || 0);
  }

  const raw = base * S * D * M * L * R * V * E;
  return Math.min(base * 25, Math.max(base * 0.08, Math.round(raw)));
}

function recordTrade(guildId, speciesId, type, userId) {
  const g   = getGuild(guildId);
  const now = Date.now();
  initPrice(g, speciesId);

  // Anti-whale: diminishing impact per user per hour
  const wKey = `${userId}_${speciesId}`;
  if (!g.tradeImpact[wKey] || now > g.tradeImpact[wKey].resetAt) {
    g.tradeImpact[wKey] = { count: 0, resetAt: now + 3_600_000 };
  }
  g.tradeImpact[wKey].count++;
  const n      = g.tradeImpact[wKey].count;
  const impact = n <= 3 ? 1.0 : n <= 7 ? 0.4 : 0.05;

  // Wash-trade guard: if user bought same species in last hour, ignore sell impact
  const washKey = `wash_${userId}_${speciesId}`;
  if (type === 'sell' && g.tradeImpact[washKey] && now < g.tradeImpact[washKey].expiry) {
    // zero impact — wash trade
  } else {
    const α = 0.3;
    if (type === 'buy') {
      g.tradeImpact[washKey] = { expiry: now + 3_600_000 };
      g.ema[speciesId].buy   = α * impact + (1 - α) * g.ema[speciesId].buy;
    } else {
      g.ema[speciesId].sell  = α * impact + (1 - α) * g.ema[speciesId].sell;
    }
  }

  const oldPrice = g.prices[speciesId].value;
  const newPrice = computeNewPrice(g, guildId, speciesId);
  g.prices[speciesId] = { value: newPrice, updatedAt: now };

  g.priceHistory[speciesId].push({ p: newPrice, t: now });
  if (g.priceHistory[speciesId].length > 200) {
    g.priceHistory[speciesId] = g.priceHistory[speciesId].slice(-200);
  }

  // Check for scheduled event
  checkAndFireEvent(g, guildId);

  saveGuild(guildId, g);
  return { oldPrice, newPrice };
}

function getCurrentPrice(guildId, speciesId, enhanceLevel = 0) {
  const g    = getGuild(guildId);
  initPrice(g, speciesId);
  const base = g.prices[speciesId].value;
  const mult = require('./enhanceManager').getEnhancePriceMult(enhanceLevel);
  return Math.round(base * mult);
}

function getMarketState(guildId, speciesId) {
  const g       = getGuild(guildId);
  const history = g.priceHistory[speciesId] || [];
  const now     = Date.now();
  const cur     = g.prices[speciesId]?.value || catalog[speciesId]?.basePrice || 0;
  const p24h    = getPriceAt(history, now - 86_400_000);
  if (!p24h) return { label: '➡️ STABLE', change: 0, color: 0x888888 };
  const pct = (cur - p24h) / p24h;
  if (pct >  0.15) return { label: '📈 BULL',     change: pct, color: 0x57f287 };
  if (pct < -0.15) return { label: '📉 BEAR',     change: pct, color: 0xed4245 };
  if (Math.abs(pct) > 0.05) return { label: '〰️ VOLATILE', change: pct, color: 0xfee75c };
  return { label: '➡️ STABLE', change: pct, color: 0x888888 };
}

// ─── Events ───────────────────────────────────────────────────────────────────

function checkAndFireEvent(g, guildId) {
  const now = Date.now();
  if (g.activeEvent && g.activeEvent.expiresAt < now) g.activeEvent = null;
  if (!g.activeEvent && now >= g.nextEventAt) {
    const ev          = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    g.activeEvent     = { ...ev, expiresAt: now + ev.duration * 3_600_000 };
    g.nextEventAt     = now + randBetween(6, 12) * 3_600_000;
  }
}

function getActiveEvent(guildId) {
  const g   = getGuild(guildId);
  const now = Date.now();
  if (g.activeEvent && g.activeEvent.expiresAt < now) {
    g.activeEvent = null;
    saveGuild(guildId, g);
    return null;
  }
  return g.activeEvent || null;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

function addListing(guildId, userId, username, instanceId, speciesId, price, enhanceLevel = 0) {
  const g = getGuild(guildId);
  g.listings.push({
    listingId: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    userId, username, instanceId, speciesId, price, enhanceLevel, listedAt: Date.now(),
  });
  saveGuild(guildId, g);
}

function removeListing(guildId, listingId) {
  const g   = getGuild(guildId);
  const idx = g.listings.findIndex(l => l.listingId === listingId);
  if (idx === -1) return null;
  const [listing] = g.listings.splice(idx, 1);
  saveGuild(guildId, g);
  return listing;
}

function getListings(guildId) { return getGuild(guildId).listings; }

function getUserListings(guildId, userId) {
  return getGuild(guildId).listings.filter(l => l.userId === userId);
}

// ─── Panel config ─────────────────────────────────────────────────────────────

function setPanelConfig(guildId, channelId, messageId) {
  const g = getGuild(guildId);
  g.panelChannelId = channelId;
  g.panelMessageId = messageId;
  saveGuild(guildId, g);
}

function getPanelConfig(guildId) {
  const g = getGuild(guildId);
  return { channelId: g.panelChannelId, messageId: g.panelMessageId };
}

module.exports = {
  getCurrentPrice, recordTrade, getMarketState,
  getActiveEvent,
  addListing, removeListing, getListings, getUserListings,
  setPanelConfig, getPanelConfig,
};
