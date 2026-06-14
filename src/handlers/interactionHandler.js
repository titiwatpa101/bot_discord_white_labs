const rp           = require('../systems/rp/handler');
const vc           = require('../systems/vc/handler');
const uno          = require('../systems/uno/command');
const verify       = require('../systems/verify/handler');
const petHandler   = require('../systems/pet/handler');
const petAdmin     = require('../systems/pet/adminHandler');
const ticketAdmin    = require('../systems/ticket/adminHandler');
const ticketHandler  = require('../systems/ticket/handler');
const calHandler     = require('../systems/calendar/handler');

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
      if (interaction.commandName === 'ticket')   return await ticketAdmin.handleCommand(interaction);
      if (interaction.commandName === 'calendar') return await calHandler.handleSetup(interaction);
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleButton(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleButton(interaction);
      if (interaction.customId.startsWith('verify_')) return await verify.handleButton(interaction);
      if (interaction.customId.startsWith('pet_'))    return await petHandler.handleButton(interaction);
      if (interaction.customId.startsWith('tk_'))      return await ticketHandler.handleButton(interaction);
      if (interaction.customId.startsWith('cal_'))     return await calHandler.handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleSelect(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleSelect(interaction);
      if (interaction.customId.startsWith('petsel_'))   return await petHandler.handleSelect(interaction);
      if (interaction.customId.startsWith('tksel_'))    return await ticketHandler.handleSelect(interaction);
      if (interaction.customId.startsWith('calsel_cancel_')) return await calHandler.handleCancelSelect(interaction);
    } else if (interaction.isRoleSelectMenu()) {
      if (interaction.customId.startsWith('calsel_role_'))   return await calHandler.handleRoleSelect(interaction);
    } else if (interaction.isUserSelectMenu()) {
      if (interaction.customId.startsWith('vc_'))       return await vc.handleUserSelect(interaction);
      if (interaction.customId.startsWith('tkusr_'))    return await ticketHandler.handleUserSelect(interaction);
      if (interaction.customId.startsWith('calsel_user_'))   return await calHandler.handleUserSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('rp_'))     return await rp.handleModal(interaction);
      if (interaction.customId.startsWith('vc_'))     return await vc.handleModal(interaction);
      if (interaction.customId.startsWith('verify_'))  return await verify.handleModal(interaction);
      if (interaction.customId.startsWith('tkmodal_'))  return await ticketHandler.handleModal(interaction);
      if (interaction.customId.startsWith('calmodal_')) return await calHandler.handleModal(interaction);
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
