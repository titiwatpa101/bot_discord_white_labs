const petManager      = require('./managers/petManager');
const marketManager   = require('./managers/marketManager');
const wtManager       = require('./managers/wonderTradeManager');
const spawnManager    = require('./managers/spawnManager');
const enhanceManager  = require('./managers/enhanceManager');
const catalog         = require('./data/catalog.json');

const mainPanel        = require('./panels/mainPanel');
const petsPanel        = require('./panels/petsPanel');
const petDetailPanel   = require('./panels/petDetailPanel');
const shopPanel        = require('./panels/shopPanel');
const shopQtyPanel     = require('./panels/shopQtyPanel');
const marketPanel      = require('./panels/marketPanel');
const wonderTradePanel = require('./panels/wonderTradePanel');
const feedPanel        = require('./panels/feedPanel');
const feedQtyPanel     = require('./panels/feedQtyPanel');
const sellPanel        = require('./panels/sellPanel');
const enhancePanel     = require('./panels/enhancePanel');
const enhanceMatPanel  = require('./panels/enhanceMatPanel');
const enhanceResultPanel = require('./panels/enhanceResultPanel');

const { updateMarketPanel }      = require('./public/marketPublic');
const { updateWonderTradePanel } = require('./public/wonderTradePublic');

// ─── Enhance Sessions ─────────────────────────────────────────────────────────
// key: `${guildId}_${userId}`  value: { targetInstId, materialInstIds[], protect, boost }
const enhanceSessions = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkOwner(interaction, userId) {
  if (interaction.user.id !== userId) {
    interaction.reply({ content: '❌ พิมพ์ `!pet` เพื่อเปิด panel ของตัวเอง', ephemeral: true });
    return false;
  }
  return true;
}

function getPanel(page, userId, guildId, user, extra) {
  switch (page) {
    case 'main':     return mainPanel.build(userId, user);
    case 'pets':     return petsPanel.build(userId, user);
    case 'shop':     return shopPanel.build(userId, user);
    case 'shopqty':  return shopQtyPanel.build(userId, guildId, user, extra);
    case 'market':   return marketPanel.build(userId, guildId, user);
    case 'trade':    return wonderTradePanel.build(userId, guildId, user);
    case 'feed':
    case 'feedmenu': return feedPanel.build(userId, user);
    case 'feedqty':  return feedQtyPanel.build(userId, user, extra);
    case 'detail':   return petDetailPanel.build(userId, user, extra);
    case 'sell':     return sellPanel.build(userId, guildId, user, extra);
    case 'enhance':  return enhancePanel.build(userId, user);
    default:         return mainPanel.build(userId, user);
  }
}

// ─── Button Handler ───────────────────────────────────────────────────────────

async function handleButton(interaction) {
  const id      = interaction.customId;
  const guildId = interaction.guildId;

  // ── Spawn claim ──────────────────────────────────────────────────────────
  if (id.startsWith('pet_spawn_')) {
    return handleSpawnClaim(interaction);
  }

  // ── Public panel openers ─────────────────────────────────────────────────
  if (id === 'pet_open_market') {
    await interaction.deferReply({ ephemeral: true });
    const user  = petManager.getUser(guildId, interaction.user.id);
    const panel = marketPanel.build(interaction.user.id, guildId, user);
    return interaction.editReply(panel);
  }

  if (id === 'pet_open_trade') {
    await interaction.deferReply({ ephemeral: true });
    const user  = petManager.getUser(guildId, interaction.user.id);
    const panel = wonderTradePanel.build(interaction.user.id, guildId, user);
    return interaction.editReply(panel);
  }

  // ── Navigation: pet_nav_USERID_PAGE[_EXTRA...] ───────────────────────────
  if (id.startsWith('pet_nav_')) {
    const parts  = id.split('_');
    const userId = parts[2];
    const page   = parts[3];
    const extra  = parts.slice(4).join('_') || null;

    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    const panel = getPanel(page, userId, guildId, user, extra);
    return interaction.editReply(panel);
  }

  // ── Actions: pet_act_USERID_ACTION[_EXTRA...] ────────────────────────────
  if (id.startsWith('pet_act_')) {
    const parts  = id.split('_');
    const userId = parts[2];
    const action = parts[3];
    const extra  = parts.slice(4).join('_') || null;

    if (!checkOwner(interaction, userId)) return;
    return handleAction(interaction, userId, guildId, action, extra);
  }
}

// ─── Action Handler ───────────────────────────────────────────────────────────

async function handleAction(interaction, userId, guildId, action, extra) {
  // Set Active
  if (action === 'setactive') {
    await interaction.deferUpdate();
    petManager.setActive(guildId, userId, extra);
    const user  = petManager.getUser(guildId, userId);
    const panel = petDetailPanel.build(userId, user, extra);
    return interaction.editReply(panel);
  }

  // Open feed menu
  if (action === 'feedmenu') {
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    const panel = feedPanel.build(userId, user);
    return interaction.editReply(panel);
  }

  // Feed with quantity — extra = "foodId:qty"
  if (action === 'feedqty') {
    await interaction.deferUpdate();
    const colonIdx = extra.lastIndexOf(':');
    const foodId   = extra.slice(0, colonIdx);
    const qty      = parseInt(extra.slice(colonIdx + 1), 10);
    const food     = petManager.FOOD_CATALOG[foodId];

    if (!food || isNaN(qty) || qty <= 0) {
      const user = petManager.getUser(guildId, userId);
      return interaction.editReply(feedPanel.build(userId, user));
    }

    const success = petManager.useFood(guildId, userId, foodId, qty);
    if (!success) {
      const user  = petManager.getUser(guildId, userId);
      const panel = feedQtyPanel.build(userId, user, foodId);
      panel.embeds[0].setFooter({ text: `❌ อาหารไม่พอ — ต้องการ ${qty} ชิ้น` });
      return interaction.editReply(panel);
    }

    const result = petManager.addExp(guildId, userId, food.exp * qty);
    const user   = petManager.getUser(guildId, userId);

    if (result?.leveled) {
      const panel = mainPanel.build(userId, user);
      panel.embeds[0].setFooter({ text: `🎉 ${catalog[result.pet.speciesId]?.name} เลเวลอัป → Lv.${result.pet.level}! (+${food.exp * qty} EXP)` });
      return interaction.editReply(panel);
    }

    const panel = feedQtyPanel.build(userId, user, foodId);
    panel.embeds[0].setFooter({ text: `✅ ให้ ${food.name} × ${qty}  (+${food.exp * qty} EXP)` });
    return interaction.editReply(panel);
  }

  // Feed all of a food type
  if (action === 'feedall') {
    await interaction.deferUpdate();
    const foodId = extra;
    const food   = petManager.FOOD_CATALOG[foodId];
    const user   = petManager.getUser(guildId, userId);
    const have   = user.food[foodId] || 0;

    if (!food || have === 0) return interaction.editReply(feedQtyPanel.build(userId, user, foodId));

    petManager.useFood(guildId, userId, foodId, have);
    const result = petManager.addExp(guildId, userId, food.exp * have);
    const fresh  = petManager.getUser(guildId, userId);

    if (result?.leveled) {
      const panel = mainPanel.build(userId, fresh);
      panel.embeds[0].setFooter({ text: `🎉 ${catalog[result.pet.speciesId]?.name} เลเวลอัป → Lv.${result.pet.level}! (+${food.exp * have} EXP)` });
      return interaction.editReply(panel);
    }

    const panel = feedQtyPanel.build(userId, fresh, foodId);
    panel.embeds[0].setFooter({ text: `✅ ให้ ${food.name} × ${have}  (+${food.exp * have} EXP)` });
    return interaction.editReply(panel);
  }

  // Buy with quantity — extra = "foodId:qty"
  if (action === 'buyqty') {
    await interaction.deferUpdate();
    const colonIdx = extra.lastIndexOf(':');
    const foodId   = extra.slice(0, colonIdx);
    const qty      = parseInt(extra.slice(colonIdx + 1), 10);
    const food     = petManager.FOOD_CATALOG[foodId];

    if (!food || isNaN(qty) || qty <= 0) {
      const user = petManager.getUser(guildId, userId);
      return interaction.editReply(shopPanel.build(userId, user));
    }

    const cost = food.price * qty;
    const user = petManager.getUser(guildId, userId);

    if ((user.coins || 0) < cost) {
      const panel = shopQtyPanel.build(userId, guildId, user, foodId);
      panel.embeds[0].setFooter({ text: `❌ เหรียญไม่พอ — ต้องการ ${cost.toLocaleString()} coins` });
      return interaction.editReply(panel);
    }

    petManager.addCoins(guildId, userId, -cost);
    petManager.addFood(guildId, userId, foodId, qty);
    const fresh = petManager.getUser(guildId, userId);
    const panel = shopQtyPanel.build(userId, guildId, fresh, foodId);
    panel.embeds[0].setFooter({ text: `✅ ซื้อ ${food.name} × ${qty} สำเร็จ! (-${cost.toLocaleString()} coins)` });
    return interaction.editReply(panel);
  }

  // Enhance: toggle protect
  if (action === 'eprot') {
    await interaction.deferUpdate();
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) return interaction.editReply(enhancePanel.build(userId, petManager.getUser(guildId, userId)));
    session.protect = !session.protect;
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Enhance: cycle boost card
  if (action === 'eboost') {
    await interaction.deferUpdate();
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) return interaction.editReply(enhancePanel.build(userId, petManager.getUser(guildId, userId)));
    session.boost = [1, 2, 0][session.boost];
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Enhance: clear selection
  if (action === 'eclear') {
    await interaction.deferUpdate();
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) return interaction.editReply(enhancePanel.build(userId, petManager.getUser(guildId, userId)));
    session.materialInstIds = [];
    session.protect         = false;
    session.boost           = 0;
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Enhance: try again (reset mats, keep target)
  if (action === 'reagain') {
    await interaction.deferUpdate();
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) return interaction.editReply(enhancePanel.build(userId, petManager.getUser(guildId, userId)));
    session.materialInstIds = [];
    session.protect         = false;
    session.boost           = 0;
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Execute enhancement
  if (action === 'doenhance') {
    await interaction.deferUpdate();
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) return interaction.editReply(mainPanel.build(userId, petManager.getUser(guildId, userId)));

    const { targetInstId, materialInstIds, protect, boost } = session;
    const user   = petManager.getUser(guildId, userId);
    const petIdx = user.pets.findIndex(p => p.instanceId === targetInstId);
    if (petIdx === -1) return interaction.editReply(mainPanel.build(userId, user));

    const pet = user.pets[petIdx];

    // Validate cards
    if (protect && !(user.items?.card_protect > 0)) {
      const panel = enhanceMatPanel.build(userId, user, session);
      panel.embeds[0].setFooter({ text: '❌ ไม่มีบัตรป้องกัน' });
      return interaction.editReply(panel);
    }
    const boostId = boost === 1 ? 'card_boost_s' : boost === 2 ? 'card_boost_m' : null;
    if (boostId && !(user.items?.[boostId] > 0)) {
      const panel = enhanceMatPanel.build(userId, user, session);
      panel.embeds[0].setFooter({ text: '❌ ไม่มีบัตรเพิ่มเรท' });
      return interaction.editReply(panel);
    }

    // Gather and remove mat pets
    const matPets = (materialInstIds || [])
      .map(id => user.pets.find(p => p.instanceId === id))
      .filter(Boolean);
    const matIds  = new Set(matPets.map(m => m.instanceId));
    user.pets     = user.pets.filter(p => !matIds.has(p.instanceId));

    // Consume cards
    if (protect) user.items.card_protect = Math.max(0, (user.items.card_protect || 0) - 1);
    if (boostId) user.items[boostId]     = Math.max(0, (user.items[boostId]     || 0) - 1);

    // Execute
    const result = enhanceManager.enhance(pet, matPets, protect, boost);
    petManager.saveUser(guildId, userId, user);

    // Reset session materials
    session.materialInstIds = [];
    session.protect         = false;
    session.boost           = 0;

    const freshUser = petManager.getUser(guildId, userId);
    const freshPet  = freshUser.pets.find(p => p.instanceId === targetInstId) || pet;
    return interaction.editReply(enhanceResultPanel.build(userId, freshUser, freshPet, result));
  }

  // Buy card from shop
  if (action === 'buycard') {
    await interaction.deferUpdate();
    const itemId = extra;
    const item   = petManager.ITEM_CATALOG[itemId];
    const user   = petManager.getUser(guildId, userId);

    if (!item) return interaction.editReply(shopPanel.build(userId, user));

    if ((user.coins || 0) < item.price) {
      const panel = shopPanel.build(userId, user);
      panel.embeds[0].setFooter({ text: `❌ เหรียญไม่พอ — ต้องการ ${item.price.toLocaleString()} coins` });
      return interaction.editReply(panel);
    }

    petManager.addCoins(guildId, userId, -item.price);
    petManager.addItem(guildId, userId, itemId, 1);
    const fresh = petManager.getUser(guildId, userId);
    const panel = shopPanel.build(userId, fresh);
    panel.embeds[0].setFooter({ text: `✅ ซื้อ ${item.name} สำเร็จ! (-${item.price.toLocaleString()} coins)` });
    return interaction.editReply(panel);
  }

  // Open sell panel
  if (action === 'sell') {
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    const panel = sellPanel.build(userId, guildId, user, extra);
    return interaction.editReply(panel);
  }

  // Wonder Trade — submit from pet detail
  if (action === 'tradesubmit') {
    await interaction.deferUpdate();
    const user = petManager.getUser(guildId, userId);
    const pet  = user.pets.find(p => p.instanceId === extra);
    if (!pet) {
      const panel = mainPanel.build(userId, user);
      return interaction.editReply(panel);
    }

    if (wtManager.inPool(guildId, userId)) {
      const entry = wtManager.matchTrade(guildId, userId);
      if (entry) {
        await executeWonderTrade(interaction, userId, guildId, extra, entry);
      } else {
        submitToPool(guildId, userId, interaction.user.username, pet);
      }
    } else {
      submitToPool(guildId, userId, interaction.user.username, pet);
    }

    updateWonderTradePanel(interaction.client, guildId).catch(() => {});
    const freshUser = petManager.getUser(guildId, userId);
    return interaction.editReply(wonderTradePanel.build(userId, guildId, freshUser));
  }

  // Wonder Trade — withdraw
  if (action === 'withdraw') {
    await interaction.deferUpdate();
    const removed = wtManager.removeFromPool(guildId, userId);
    if (removed) {
      petManager.addPet(guildId, userId, removed.speciesId);
    }
    updateWonderTradePanel(interaction.client, guildId).catch(() => {});
    const user  = petManager.getUser(guildId, userId);
    return interaction.editReply(wonderTradePanel.build(userId, guildId, user));
  }
}

function submitToPool(guildId, userId, username, pet) {
  const sp = catalog[pet.speciesId];
  petManager.removePet(guildId, userId, pet.instanceId);
  wtManager.addToPool(guildId, {
    userId, username,
    instanceId: pet.instanceId,
    speciesId:  pet.speciesId,
    name:       sp?.name || pet.speciesId,
    rarity:     sp?.rarity || 'common',
    emoji:      sp?.emoji || '🐾',
    level:      pet.level,
  });
}

async function executeWonderTrade(interaction, userId, guildId, myInstanceId, theirEntry) {
  const myPet = petManager.getUser(guildId, userId).pets.find(p => p.instanceId === myInstanceId);
  if (myPet) petManager.removePet(guildId, userId, myInstanceId);

  petManager.addPet(guildId, userId, theirEntry.speciesId);
  petManager.addExp(guildId, userId, 30);

  petManager.addPet(guildId, theirEntry.userId, myPet?.speciesId || 'cat_orange');
  petManager.addExp(guildId, theirEntry.userId, 30);
}

// ─── Select Menu Handler ──────────────────────────────────────────────────────

async function handleSelect(interaction) {
  const id      = interaction.customId;
  const guildId = interaction.guildId;
  const value   = interaction.values[0];

  // Pet selection → go to detail
  if (id.startsWith('petsel_pet_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    return interaction.editReply(petDetailPanel.build(userId, user, value));
  }

  // Enhance pet selection (step 1) → create session, go to mat panel
  if (id.startsWith('petsel_enhance_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const session = { targetInstId: value, materialInstIds: [], protect: false, boost: 0 };
    enhanceSessions.set(`${guildId}_${userId}`, session);
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Enhance material selection (step 2) → update session.materialInstIds
  if (id.startsWith('petsel_emat_')) {
    const userId = id.slice('petsel_emat_'.length);
    if (!checkOwner(interaction, userId)) return;
    const sessionKey = `${guildId}_${userId}`;
    const session    = enhanceSessions.get(sessionKey);
    if (!session) {
      return interaction.reply({ content: '❌ Session หมดอายุ กรุณาเลือกสัตว์ใหม่', ephemeral: true });
    }
    session.materialInstIds = interaction.values.filter(v => v !== '__none__').slice(0, 7);
    await interaction.deferUpdate();
    const user = petManager.getUser(guildId, userId);
    return interaction.editReply(enhanceMatPanel.build(userId, user, session));
  }

  // Feed selection (step 1) → go to qty panel
  if (id.startsWith('petsel_feed_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    return interaction.editReply(feedQtyPanel.build(userId, user, value));
  }

  // Shop item selection (step 1) → go to qty panel
  if (id.startsWith('petsel_shopitem_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const user  = petManager.getUser(guildId, userId);
    return interaction.editReply(shopQtyPanel.build(userId, guildId, user, value));
  }

  // Legacy petsel_shop_ handler (backward compat for old messages)
  if (id.startsWith('petsel_shop_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();
    const [foodId] = value.split('__');
    const user  = petManager.getUser(guildId, userId);
    return interaction.editReply(shopQtyPanel.build(userId, guildId, user, foodId));
  }

  // Market buy
  if (id.startsWith('petsel_market_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();

    const listing = marketManager.getListings(guildId).find(l => l.listingId === value);
    const user    = petManager.getUser(guildId, userId);

    if (!listing) {
      const panel = marketPanel.build(userId, guildId, user);
      panel.embeds[0].setFooter({ text: '❌ listing นี้ถูกซื้อไปแล้ว' });
      return interaction.editReply(panel);
    }
    if (listing.userId === userId) {
      const panel = marketPanel.build(userId, guildId, user);
      panel.embeds[0].setFooter({ text: '❌ ไม่สามารถซื้อสิ่งที่ตัวเองขายได้' });
      return interaction.editReply(panel);
    }
    if ((user.coins || 0) < listing.price) {
      const panel = marketPanel.build(userId, guildId, user);
      panel.embeds[0].setFooter({ text: `❌ เหรียญไม่พอ — ต้องการ ${listing.price.toLocaleString()} coins` });
      return interaction.editReply(panel);
    }

    marketManager.removeListing(guildId, listing.listingId);
    petManager.addCoins(guildId, userId, -listing.price);
    petManager.addCoins(guildId, listing.userId, listing.price);
    petManager.addPet(guildId, userId, listing.speciesId);
    petManager.addExp(guildId, userId, 15);

    marketManager.recordTrade(guildId, listing.speciesId, 'buy', userId);
    updateMarketPanel(interaction.client, guildId).catch(() => {});

    const freshUser = petManager.getUser(guildId, userId);
    const sp        = catalog[listing.speciesId];
    const panel     = marketPanel.build(userId, guildId, freshUser);
    panel.embeds[0].setFooter({ text: `✅ ซื้อ ${sp?.emoji || ''} ${sp?.name || listing.speciesId} สำเร็จ! (-${listing.price.toLocaleString()} coins)` });
    return interaction.editReply(panel);
  }

  // Wonder Trade submit via select
  if (id.startsWith('petsel_trade_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();

    const user = petManager.getUser(guildId, userId);
    const pet  = user.pets.find(p => p.instanceId === value);
    if (!pet) {
      return interaction.editReply(wonderTradePanel.build(userId, guildId, user));
    }

    const match = wtManager.matchTrade(guildId, userId);
    if (match) {
      petManager.removePet(guildId, userId, pet.instanceId);
      petManager.addPet(guildId, userId, match.speciesId);
      petManager.addExp(guildId, userId, 30);
      petManager.addPet(guildId, match.userId, pet.speciesId);
      petManager.addExp(guildId, match.userId, 30);

      updateWonderTradePanel(interaction.client, guildId).catch(() => {});
      const freshUser = petManager.getUser(guildId, userId);
      const sp        = catalog[match.speciesId];
      const panel     = wonderTradePanel.build(userId, guildId, freshUser);
      panel.embeds[0].setFooter({ text: `🎉 Match! ได้รับ ${sp?.emoji || ''} ${sp?.name || match.speciesId} จาก @${match.username}!` });
      return interaction.editReply(panel);
    }

    submitToPool(guildId, userId, interaction.user.username, pet);
    updateWonderTradePanel(interaction.client, guildId).catch(() => {});
    const freshUser = petManager.getUser(guildId, userId);
    const panel     = wonderTradePanel.build(userId, guildId, freshUser);
    panel.embeds[0].setFooter({ text: '⏳ สัตว์อยู่ในพูลแล้ว — รอให้มีคนมาแลก' });
    return interaction.editReply(panel);
  }

  // Sell price selection
  if (id.startsWith('petsel_sellprice_')) {
    const userId = id.split('_')[2];
    if (!checkOwner(interaction, userId)) return;
    await interaction.deferUpdate();

    const [instanceId, priceStr] = value.split('__');
    const price = parseInt(priceStr, 10);
    const user  = petManager.getUser(guildId, userId);
    const pet   = user.pets.find(p => p.instanceId === instanceId);

    if (!pet) {
      return interaction.editReply(mainPanel.build(userId, user));
    }

    petManager.removePet(guildId, userId, instanceId);
    marketManager.addListing(guildId, userId, interaction.user.username, instanceId, pet.speciesId, price, pet.enhanceLevel || 0);
    marketManager.recordTrade(guildId, pet.speciesId, 'sell', userId);
    updateMarketPanel(interaction.client, guildId).catch(() => {});

    const sp        = catalog[pet.speciesId];
    const freshUser = petManager.getUser(guildId, userId);
    const panel     = marketPanel.build(userId, guildId, freshUser);
    panel.embeds[0].setFooter({ text: `✅ ลงขาย ${sp?.emoji || ''} ${sp?.name || pet.speciesId} ที่ ${price.toLocaleString()} coins แล้ว` });
    return interaction.editReply(panel);
  }
}

// ─── Spawn Claim ──────────────────────────────────────────────────────────────

async function handleSpawnClaim(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildId   = interaction.guildId;
  const channelId = interaction.channelId;
  const userId    = interaction.user.id;

  const spawn = spawnManager.getActiveSpawn(guildId, channelId);
  if (!spawn || spawn.expiresAt < Date.now()) {
    return interaction.editReply({ content: '❌ สัตว์ตัวนี้หนีไปแล้ว!' });
  }

  spawnManager.clearSpawn(guildId, channelId);

  const pet = petManager.addPet(guildId, userId, spawn.speciesId);
  petManager.addExp(guildId, userId, 15);
  const sp = catalog[spawn.speciesId];

  try {
    const msg = await interaction.channel.messages.fetch(spawn.messageId).catch(() => null);
    if (msg) {
      const { buildSpawnExpiredEmbed } = require('./public/spawnPublic');
      await msg.edit({ embeds: [buildSpawnExpiredEmbed(sp)], components: [] });
    }
  } catch {}

  return interaction.editReply({
    content: `🎉 จับ ${sp?.emoji || '🐾'} **${sp?.name || spawn.speciesId}** สำเร็จ! ตัวใหม่เพิ่มเข้าคลังแล้ว\nพิมพ์ \`!pet\` เพื่อดูสัตว์ของคุณ`,
  });
}

module.exports = { handleButton, handleSelect };
