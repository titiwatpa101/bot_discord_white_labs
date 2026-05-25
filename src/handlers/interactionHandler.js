const rp  = require('../systems/rp/handler');
const vc  = require('../systems/vc/handler');
const uno = require('../systems/uno/command');

// ─── Main Interaction Router ──────────────────────────────────────────────────
// เพิ่มระบบใหม่: import handler ด้านบน แล้วเพิ่ม prefix check ด้านล่าง

module.exports = async function interactionHandler(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'rp')  return rp.handleRp(interaction);
      if (interaction.commandName === 'vc')  return vc.handleCommand(interaction);
      if (interaction.commandName === 'uno') return uno.execute(interaction);
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('rp_')) return rp.handleButton(interaction);
      if (interaction.customId.startsWith('vc_')) return vc.handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('rp_')) return rp.handleSelect(interaction);
      if (interaction.customId.startsWith('vc_')) return vc.handleSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('rp_')) return rp.handleModal(interaction);
      if (interaction.customId.startsWith('vc_')) return vc.handleModal(interaction);
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
