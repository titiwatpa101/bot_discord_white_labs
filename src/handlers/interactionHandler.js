const rp         = require('../systems/rp/handler');
const vc         = require('../systems/vc/handler');
const uno        = require('../systems/uno/command');
const verify     = require('../systems/verify/handler');
const petHandler = require('../systems/pet/handler');
const petAdmin   = require('../systems/pet/adminHandler');

// ─── Main Interaction Router ──────────────────────────────────────────────────
// เพิ่มระบบใหม่: import handler ด้านบน แล้วเพิ่ม prefix check ด้านล่าง

module.exports = async function interactionHandler(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'rp')     return await rp.handleRp(interaction);
      if (interaction.commandName === 'vc')     return await vc.handleCommand(interaction);
      if (interaction.commandName === 'uno')    return await uno.execute(interaction);
      if (interaction.commandName === 'verify') return await verify.handleCommand(interaction);
      if (interaction.commandName === 'pet')    return await petAdmin.handleCommand(interaction);
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleButton(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleButton(interaction);
      if (interaction.customId.startsWith('verify_')) return await verify.handleButton(interaction);
      if (interaction.customId.startsWith('pet_'))    return await petHandler.handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleSelect(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleSelect(interaction);
      if (interaction.customId.startsWith('petsel_')) return await petHandler.handleSelect(interaction);
    } else if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('vc_')) return await vc.handleUserSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleModal(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleModal(interaction);
      if (interaction.customId.startsWith('verify_')) return await verify.handleModal(interaction);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const reply = { content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (_) {}
  }
};
