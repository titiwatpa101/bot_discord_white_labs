require('dotenv').config();
const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Auto-discover all command files: src/systems/*/command.js
const systemsDir = path.join(__dirname, 'src/systems');
const commandFiles = fs.readdirSync(systemsDir)
  .filter((dir) => fs.existsSync(path.join(systemsDir, dir, 'command.js')))
  .map((dir) => require(`./src/systems/${dir}/command`));

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commandFiles.length} slash command(s)...`);
    await rest.put(
      process.env.GUILD_ID
        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        : Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandFiles.map((c) => c.data.toJSON()) }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
})();
