class Session {
  constructor(channelId, guildId) {
    this.channelId = channelId;
    this.guildId = guildId;
    this.active = false;
    this.maxPlayers = 0;
    this.queue = [];
    this.currentQueueIndex = 0;
    this.conversationHistory = [];
    this.roundMessages = [];
    // Layer 2 — World/Setting
    this.worldName = null;
    this.worldPrompt = null;
    // Layer 3 — Character
    this.charName = null;
    this.charPrompt = null;
  }

  get currentUser() {
    return this.queue[this.currentQueueIndex] ?? null;
  }

  isUserInQueue(userId) {
    return this.queue.some((u) => u.userId === userId);
  }

  addToQueue(userId, username, displayName) {
    if (this.isUserInQueue(userId)) return { success: false, reason: 'already_in_queue' };
    if (this.maxPlayers > 0 && this.queue.length >= this.maxPlayers)
      return { success: false, reason: 'queue_full' };
    this.queue.push({ userId, username, displayName, role: null, position: this.queue.length + 1 });
    return { success: true, position: this.queue.length };
  }

  setUserRole(userId, role) {
    const user = this.queue.find((u) => u.userId === userId);
    if (!user) return false;
    user.role = role;
    return true;
  }

  setWorld(name, prompt) {
    this.worldName = name;
    this.worldPrompt = prompt;
    this.conversationHistory = [];
  }

  setChar(name, prompt) {
    this.charName = name;
    this.charPrompt = prompt;
    this.conversationHistory = [];
  }

  removeFromQueue(userId) {
    const idx = this.queue.findIndex((u) => u.userId === userId);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    this.queue.forEach((u, i) => (u.position = i + 1));
    if (this.currentQueueIndex >= this.queue.length) this.currentQueueIndex = 0;
    return true;
  }

  receiveMessage(userId, displayName, content) {
    this.roundMessages.push({ userId, displayName, content });
    this.currentQueueIndex++;

    if (this.currentQueueIndex >= this.queue.length) {
      this.currentQueueIndex = 0;
      const messages = [...this.roundMessages];
      this.roundMessages = [];
      return { roundComplete: true, messages };
    }

    return { roundComplete: false, messages: null };
  }
}

const sessions = new Map();

module.exports = {
  getSession(channelId) {
    return sessions.get(channelId) ?? null;
  },

  getOrCreate(channelId, guildId) {
    if (!sessions.has(channelId)) sessions.set(channelId, new Session(channelId, guildId));
    return sessions.get(channelId);
  },

  deleteSession(channelId) {
    sessions.delete(channelId);
  },
};
