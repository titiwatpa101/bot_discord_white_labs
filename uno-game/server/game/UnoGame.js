const { createDeck, shuffle } = require('./Deck');

const HAND_SIZE = 7;

class UnoGame {
  constructor(roomId) {
    this.id      = roomId;
    this.state   = 'waiting';   // waiting | playing | ended
    this.players = [];          // [{ socketId, userId, displayName, avatar, hand, saidUno }]
    this.deck         = [];
    this.discardPile  = [];
    this.currentPlayerIndex = 0;
    this.direction   = 1;       // 1 = clockwise, -1 = counter-clockwise
    this.pendingDraw  = 0;      // accumulated +2 / +4
    this.winner       = null;
  }

  // ─── Lobby ───────────────────────────────────────────────────────────────────

  addPlayer(socketId, userId, displayName, avatar) {
    if (this.state !== 'waiting')
      return { error: 'เกมเริ่มแล้ว ไม่สามารถเข้าร่วมได้' };
    if (this.players.length >= 4)
      return { error: 'ห้องเต็ม (สูงสุด 4 คน)' };
    if (this.players.find((p) => p.userId === userId))
      return { error: 'คุณอยู่ในห้องนี้แล้ว' };

    const isGuest = userId.startsWith('guest_');
    this.players.push({ socketId, userId, displayName, avatar, hand: [], saidUno: false, isGuest });
    return { ok: true };
  }

  removePlayer(socketId) {
    const idx = this.players.findIndex((p) => p.socketId === socketId);
    if (idx === -1) return;
    this.players.splice(idx, 1);
    // Adjust currentPlayerIndex if needed
    if (this.currentPlayerIndex >= this.players.length && this.players.length > 0) {
      this.currentPlayerIndex = 0;
    }
  }

  // ─── Game start ───────────────────────────────────────────────────────────────

  start() {
    if (this.players.length < 2)
      return { error: 'ต้องมีผู้เล่นอย่างน้อย 2 คน' };

    this.deck = createDeck();
    this.discardPile = [];
    this.direction = 1;
    this.currentPlayerIndex = 0;
    this.pendingDraw = 0;

    for (const p of this.players) {
      p.hand = this.deck.splice(0, HAND_SIZE);
      p.saidUno = false;
    }

    // First card must be a number card
    let first;
    do {
      first = this.deck.shift();
      if (first.color === 'wild') {
        this.deck.push(first);
        this.deck = shuffle(this.deck);
        first = null;
      }
    } while (!first);

    this.discardPile.push(first);
    this.state = 'playing';
    return { ok: true };
  }

  // ─── Getters ──────────────────────────────────────────────────────────────────

  get topCard() {
    return this.discardPile[this.discardPile.length - 1];
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  // ─── Rules ────────────────────────────────────────────────────────────────────

  canPlay(card) {
    const top = this.topCard;
    const effectiveColor = top.chosenColor || top.color;

    if (card.color === 'wild') return true;

    // When there's a pending draw stack, only matching draw cards can be stacked
    if (this.pendingDraw > 0) {
      if (top.type === 'draw2')  return card.type === 'draw2';
      if (top.type === 'wild4')  return card.type === 'wild4';
      return false;
    }

    return card.color === effectiveColor || card.type === top.type;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────

  playCard(socketId, cardId, chosenColor = null) {
    const player = this.players.find((p) => p.socketId === socketId);
    if (!player)                              return { error: 'ไม่พบผู้เล่น' };
    if (this.currentPlayer.socketId !== socketId) return { error: 'ยังไม่ถึงเทิร์นของคุณ' };

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1)                       return { error: 'ไม่มีไพ่นี้ในมือ' };

    const card = player.hand[cardIdx];
    if (!this.canPlay(card))                  return { error: 'เล่นไพ่ใบนี้ไม่ได้' };

    // Wild cards require a chosen color
    if (card.color === 'wild' && !chosenColor)
      return { error: 'กรุณาเลือกสีสำหรับ Wild card' };

    // Remove from hand
    player.hand.splice(cardIdx, 1);
    player.saidUno = false;

    // Embed chosen color into the card object stored in discard pile
    const played = card.color === 'wild' ? { ...card, chosenColor } : { ...card };
    this.discardPile.push(played);

    // Win condition
    if (player.hand.length === 0) {
      this.state  = 'ended';
      this.winner = { userId: player.userId, displayName: player.displayName };
      return { ok: true, card: played, won: true };
    }

    // Apply card effects
    let skip = false;
    switch (played.type) {
      case 'draw2':
        this.pendingDraw += 2;
        skip = true;
        break;
      case 'wild4':
        this.pendingDraw += 4;
        skip = true;
        break;
      case 'skip':
        skip = true;
        break;
      case 'reverse':
        this.direction *= -1;
        if (this.players.length === 2) skip = true; // Reverse = Skip in 2-player
        break;
    }

    this._advanceTurn(skip);
    return { ok: true, card: played };
  }

  drawCard(socketId) {
    const player = this.players.find((p) => p.socketId === socketId);
    if (!player)                              return { error: 'ไม่พบผู้เล่น' };
    if (this.currentPlayer.socketId !== socketId) return { error: 'ยังไม่ถึงเทิร์นของคุณ' };

    const count = this.pendingDraw > 0 ? this.pendingDraw : 1;
    this.pendingDraw = 0;

    const drawn = this._draw(count);
    player.hand.push(...drawn);
    player.saidUno = false;

    this._advanceTurn(false);
    return { ok: true, drawn };
  }

  sayUno(socketId) {
    const player = this.players.find((p) => p.socketId === socketId);
    if (!player)              return { error: 'ไม่พบผู้เล่น' };
    if (player.hand.length !== 1) return { error: 'กด UNO ได้เมื่อเหลือ 1 ใบเท่านั้น' };
    player.saidUno = true;
    return { ok: true };
  }

  catchUno(catcherSocketId, targetUserId) {
    const target = this.players.find((p) => p.userId === targetUserId);
    if (!target)                              return { error: 'ไม่พบผู้เล่นเป้าหมาย' };
    if (target.hand.length !== 1 || target.saidUno) return { error: 'จับไม่ได้' };

    const penalty = this._draw(2);
    target.hand.push(...penalty);
    return { ok: true, targetDisplayName: target.displayName };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────────

  _advanceTurn(skip = false) {
    const steps = skip ? 2 : 1;
    const len   = this.players.length;
    this.currentPlayerIndex = ((this.currentPlayerIndex + this.direction * steps) % len + len) % len;
  }

  _draw(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        const top = this.discardPile.pop();
        this.deck = shuffle(this.discardPile);
        this.discardPile = [top];
      }
      if (this.deck.length > 0) drawn.push(this.deck.shift());
    }
    return drawn;
  }

  // ─── State snapshot (per-player, hides other hands) ─────────────────────────

  getStateFor(socketId) {
    return {
      id:    this.id,
      state: this.state,
      players: this.players.map((p) => ({
        socketId:        p.socketId,
        userId:          p.userId,
        displayName:     p.displayName,
        avatar:          p.avatar,
        handCount:       p.hand.length,
        saidUno:         p.saidUno,
        isGuest:         p.isGuest,
        isCurrentPlayer: p.socketId === this.currentPlayer?.socketId,
        hand:            p.socketId === socketId ? p.hand : undefined,
      })),
      topCard:            this.topCard,
      deckCount:          this.deck.length,
      currentPlayerIndex: this.currentPlayerIndex,
      direction:          this.direction,
      pendingDraw:        this.pendingDraw,
      winner:             this.winner,
    };
  }
}

module.exports = UnoGame;
