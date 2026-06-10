const petManager    = require('./managers/petManager');
const marketManager = require('./managers/marketManager');
const wtManager     = require('./managers/wonderTradeManager');
const spawnManager  = require('./managers/spawnManager');

const { buildMarketEmbed, updateMarketPanel }          = require('./public/marketPublic');
const { buildWonderTradeEmbed, updateWonderTradePanel } = require('./public/wonderTradePublic');

async function handleCommand(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub   = interaction.options.getSubcommand();
  const guildId = interaction.guildId;

  // ── /pet spawn ───────────────────────────────────────────────────────────
  if (group === 'spawn') {
    if (sub === 'setup') {
      const channel  = interaction.options.getChannel('channel');
      const interval = interaction.options.getInteger('interval') || 30;
      spawnManager.setupChannel(guildId, channel.id, interval);
      spawnManager.startSpawnLoop(interaction.client, guildId);
      return interaction.reply({
        content: `✅ ตั้งค่า spawn ที่ ${channel} ทุก **${interval} นาที** แล้ว`,
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      spawnManager.removeChannel(guildId, channel.id);
      return interaction.reply({ content: `✅ ลบ ${channel} ออกจากระบบ spawn แล้ว`, ephemeral: true });
    }

    if (sub === 'trigger') {
      await interaction.reply({ content: '🌟 กำลัง spawn...', ephemeral: true });
      spawnManager.triggerSpawn(interaction.client, guildId).catch(console.error);
      return;
    }
  }

  // ── /pet market setup ────────────────────────────────────────────────────
  if (group === 'market' && sub === 'setup') {
    const channel = interaction.options.getChannel('channel');
    await interaction.deferReply({ ephemeral: true });

    const { embed, row } = buildMarketEmbed(guildId);
    const msg = await channel.send({ embeds: [embed], components: [row] });
    marketManager.setPanelConfig(guildId, channel.id, msg.id);

    return interaction.editReply({ content: `✅ ส่ง market panel ไปที่ ${channel} แล้ว` });
  }

  // ── /pet wondertrade setup ───────────────────────────────────────────────
  if (group === 'wondertrade' && sub === 'setup') {
    const channel = interaction.options.getChannel('channel');
    await interaction.deferReply({ ephemeral: true });

    const { embed, row } = buildWonderTradeEmbed(guildId);
    const msg = await channel.send({ embeds: [embed], components: [row] });
    wtManager.setPanelConfig(guildId, channel.id, msg.id);

    return interaction.editReply({ content: `✅ ส่ง Wonder Trade panel ไปที่ ${channel} แล้ว` });
  }

  // ── /pet give ────────────────────────────────────────────────────────────
  if (!group && sub === 'give') {
    const target  = interaction.options.getUser('user');
    const species = interaction.options.getString('species');
    petManager.addPet(guildId, target.id, species);
    const catalog = require('./data/catalog.json');
    const sp      = catalog[species];
    return interaction.reply({
      content: `✅ ให้ ${sp?.emoji || ''} **${sp?.name || species}** แก่ ${target} แล้ว`,
      ephemeral: true,
    });
  }

  // ── /pet coins ───────────────────────────────────────────────────────────
  if (!group && sub === 'coins') {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const total  = petManager.addCoins(guildId, target.id, amount);
    return interaction.reply({
      content: `✅ ให้ **${amount.toLocaleString()} coins** แก่ ${target} (รวม: ${total.toLocaleString()})`,
      ephemeral: true,
    });
  }
}

module.exports = { handleCommand };
