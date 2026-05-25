const { v4: uuidv4 } = require('uuid');

const COLORS   = ['red', 'green', 'blue', 'yellow'];
const NUMBERS  = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SPECIALS = ['skip', 'reverse', 'draw2'];

// Standard UNO deck: 108 cards
// Each color: 1×0, 2×1–9, 2×skip, 2×reverse, 2×draw2  → 25 cards × 4 = 100
// Wild: 4×wild, 4×wild4                                 → 8 cards
// Total: 108

function createDeck() {
  const cards = [];

  for (const color of COLORS) {
    cards.push({ id: uuidv4(), color, type: '0' }); // 0 once

    for (const n of NUMBERS.slice(1)) {             // 1–9 twice
      cards.push({ id: uuidv4(), color, type: n });
      cards.push({ id: uuidv4(), color, type: n });
    }

    for (const s of SPECIALS) {                     // specials twice
      cards.push({ id: uuidv4(), color, type: s });
      cards.push({ id: uuidv4(), color, type: s });
    }
  }

  for (let i = 0; i < 4; i++) {                    // wilds × 4 each
    cards.push({ id: uuidv4(), color: 'wild', type: 'wild' });
    cards.push({ id: uuidv4(), color: 'wild', type: 'wild4' });
  }

  return shuffle(cards);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { createDeck, shuffle };
