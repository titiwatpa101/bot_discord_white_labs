const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'rp_messages.csv');
const BOM = '﻿';
const HEADER = `${BOM}timestamp,channelId,userId,username,displayName,content\n`;

function escape(value) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function ensureFile() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, HEADER, 'utf-8');
}

function logMessage({ channelId, userId, username, displayName, content }) {
  try {
    ensureFile();
    const timestamp = new Date().toISOString();
    const row = [timestamp, channelId, userId, username, displayName, content]
      .map(escape)
      .join(',') + '\n';
    fs.appendFileSync(LOG_FILE, row, 'utf-8');
  } catch (err) {
    console.error('[CSV Logger] Failed to write:', err.message);
  }
}

module.exports = { logMessage };
