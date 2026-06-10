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
      if (interaction.commandName === 'rp')     return rp.handleRp(interaction);
      if (interaction.commandName === 'vc')     return vc.handleCommand(interaction);
      if (interaction.commandName === 'uno')    return uno.execute(interaction);
      if (interaction.commandName === 'verify') return verify.handleCommand(interaction);
      if (interaction.commandName === 'pet')    return petAdmin.handleCommand(interaction);
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('rp_'))     return rp.handleButton(interaction);
      if (interaction.customId.startsWith('vc_'))     return vc.handleButton(interaction);
      if (interaction.customId.startsWith('verify_')) return verify.handleButton(interaction);
      if (interaction.customId.startsWith('pet_'))    return petHandler.handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('rp_')) return rp.handleSelect(interaction);
      if (interaction.customId.startsWith('vc_'))     return vc.handleSelect(interaction);
      if (interaction.customId.startsWith('petsel_')) return petHandler.handleSelect(interaction);
    } else if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('vc_')) return vc.handleUserSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('rp_'))     return rp.handleModal(interaction);
      if (interaction.customId.startsWith('vc_'))     return vc.handleModal(interaction);
      if (interaction.customId.startsWith('verify_')) return verify.handleModal(interaction);
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
