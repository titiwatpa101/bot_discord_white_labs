const { loadQueue, addEntry, removeEntry, NEWBIE_DURATION } = require('./newbieManager');

const NEWBIE_ROLE_ID = process.env.NEWBIE_ROLE_ID;

// ─── Role removal ─────────────────────────────────────────────────────────────

function scheduleRoleRemoval(client, userId, guildId, delay) {
  setTimeout(async () => {
    try {
      const guild  = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);

      if (member.roles.cache.has(NEWBIE_ROLE_ID)) {
        await member.roles.remove(NEWBIE_ROLE_ID);
        console.log(`[Newbie] ✅ เอา role เด็กใหม่ออกจาก ${member.user.tag}`);
      }
    } catch (err) {
      // Member อาจออกจาก server ไปแล้ว — ไม่ใช่ error จริง
      console.warn(`[Newbie] ⚠️  ลบ role ไม่ได้ (userId: ${userId}): ${err.message}`);
    } finally {
      removeEntry(userId, guildId);
    }
  }, delay);
}

// ─── Event: กดเข้า server ─────────────────────────────────────────────────────

async function onGuildMemberAdd(member) {
  if (!NEWBIE_ROLE_ID) {
    console.warn('[Newbie] ⚠️  ยังไม่ได้ตั้ง NEWBIE_ROLE_ID ใน .env');
    return;
  }

  try {
    await member.roles.add(NEWBIE_ROLE_ID);
    addEntry(member.id, member.guild.id);
    scheduleRoleRemoval(member.client, member.id, member.guild.id, NEWBIE_DURATION);

    const hours = Math.round(NEWBIE_DURATION / 3_600_000);
    console.log(`[Newbie] 🆕 ${member.user.tag} เข้าร่วม → ติด role เด็กใหม่ (${hours}h)`);
  } catch (err) {
    console.error(`[Newbie] ❌ ให้ role ไม่ได้ (${member.user.tag}):`, err.message);
  }
}

// ─── Init: restore timers หลัง bot restart ───────────────────────────────────

async function initNewbieSystem(client) {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const now = Date.now();
  for (const entry of queue) {
    const delay = Math.max(0, entry.removeAt - now);
    scheduleRoleRemoval(client, entry.userId, entry.guildId, delay);
  }

  console.log(`[Newbie] 🔄 Restored ${queue.length} pending removal(s) จาก queue`);
}

module.exports = { onGuildMemberAdd, initNewbieSystem };
