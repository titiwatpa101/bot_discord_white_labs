require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const interactionHandler = require('./src/handlers/interactionHandler');
const messageHandler = require('./src/handlers/messageHandler');
const vcVoiceHandler = require('./src/systems/vc/voiceStateHandler');
const { onGuildMemberAdd, initNewbieSystem } = require('./src/systems/newbie/guildMemberHandler');
const spawnManager    = require('./src/systems/pet/managers/spawnManager');
const coinDropManager = require('./src/systems/pet/managers/coinDropManager');
const ticketManager   = require('./src/systems/ticket/managers/ticketManager');
const calHandler      = require('./src/systems/calendar/handler');

// ─── Validate required env vars ───────────────────────────────────────────────
const REQUIRED_ENV = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  console.error('   Copy .env.example → .env and fill in the values');
  process.exit(1);
}

// ─── Discord Client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,   // ← Privileged intent (ต้องเปิดใน Dev Portal)
  ],
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📡 Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`🤖 Systems: RP ✓  VC ✓  Newbie ✓  Pet ✓`);
  await initNewbieSystem(client);
  spawnManager.initAllSpawns(client);
  coinDropManager.startCoinDrop(client);
  ticketManager.startScheduler(client);
  calHandler.startScheduler(client);
});

client.on('interactionCreate', interactionHandler);
client.on('messageCreate', messageHandler);
client.on('voiceStateUpdate', vcVoiceHandler);
client.on('guildMemberAdd', onGuildMemberAdd);

client.on('error', (err) => console.error('❌ Client error:', err));
client.on('warn', (msg) => console.warn('⚠️  Warning:', msg));

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal} — shutting down...`);
  client.destroy();
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(process.env.DISCORD_TOKEN);
