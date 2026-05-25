const { getSession } = require('./sessionManager');
const { generateResponse } = require('./aiService');
const { splitMessage } = require('../../shared/utils');
const { logMessage } = require('../../shared/csvLogger');

module.exports = async function rpMessageHandler(message) {
  const session = getSession(message.channelId);
  if (!session || !session.active) return;

  console.log(`[MSG] ch:${message.channelId} | ${message.author.username}: ${message.content.slice(0, 40)}`);
  if (!session.currentUser) return;

  // Block users not in the queue
  if (!session.isUserInQueue(message.author.id)) {
    try { await message.delete(); } catch (_) {}
    try {
      const warn = await message.channel.send(
        `> <@${message.author.id}> ❌ ห้องนี้กำลังโรลเพลย์อยู่ ไม่สามารถแชทได้จนกว่าจะ \`/rp stop\``
      );
      setTimeout(() => warn.delete().catch(() => {}), 6000);
    } catch (_) {}
    return;
  }

  // Block users whose turn it isn't
  if (session.currentUser.userId !== message.author.id) {
    try { await message.delete(); } catch (_) {}
    try {
      const warn = await message.channel.send(
        `> <@${message.author.id}> ⏳ ยังไม่ถึงคิวของคุณ! รอ <@${session.currentUser.userId}> ก่อนนะ`
      );
      setTimeout(() => warn.delete().catch(() => {}), 6000);
    } catch (_) {}
    return;
  }

  console.log(`[Queue] ch:${message.channelId} | expected:${session.currentUser.userId} | got:${message.author.id}`);

  const displayName = message.member?.displayName || message.author.username;

  logMessage({
    channelId: message.channelId,
    userId: message.author.id,
    username: message.author.username,
    displayName,
    content: message.content,
  });

  const result = session.receiveMessage(message.author.id, displayName, message.content);

  if (result.roundComplete) {
    console.log(`[AI] Round complete — calling Ollama...`);
    try {
      await message.channel.sendTyping();
      const aiResponse = await generateResponse(session, result.messages);
      console.log(`[AI] Got response (${aiResponse.length} chars)`);

      for (const chunk of splitMessage(aiResponse)) {
        await message.channel.send(chunk);
      }

      const firstUser = session.queue[0];
      await message.channel.send(`> ถึงคิวของ <@${firstUser.userId}> แล้ว! 🎭`);
    } catch (err) {
      console.error('[AI Error]', err);
      try {
        await message.channel.send('❌ AI ตอบไม่ได้ กรุณาลองใหม่ หรือใช้ `/rp skip` เพื่อข้ามเทิร์นนี้');
      } catch (sendErr) {
        console.error('[Send Error] Cannot send error message:', sendErr);
      }
    }
  } else {
    try {
      const next = session.currentUser;
      await message.channel.send(`> ถึงคิวของ <@${next.userId}> แล้ว! 🎭`);
    } catch (err) {
      console.error('[Send Error] Cannot tag next user:', err);
    }
  }
};
