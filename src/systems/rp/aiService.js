const { systemCore, world: loadWorld, character: loadChar } = require('../../shared/promptLoader');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';

const RANDOM_EVENTS = [
  'แทรก NPC ลึกลับเข้ามามีปฏิสัมพันธ์กับผู้เล่นอย่างน้อยหนึ่งคนโดยตรง',
  'สถานการณ์พลิกผัน — เกิดอันตรายหรืออุปสรรคใหม่ที่ผู้เล่นต้องรับมือทันที',
  'เปิดเผยความลับหรือเบาะแสสำคัญที่เปลี่ยนทิศทางของเรื่องราว',
  'สภาพแวดล้อมเปลี่ยนแปลงอย่างกะทันหัน เช่น พายุ แผ่นดินไหว หรือพลังงานลึกลับพวยพุ่ง',
  'ผู้เล่นถูกบังคับให้เลือกระหว่างสองทางที่ยากพอกัน',
  'ไอเท็มหรือสิ่งของสำคัญถูกค้นพบหรือสูญหาย',
  'ศัตรูเก่าหรือพันธมิตรที่ไม่คาดฝันปรากฏตัว',
];

async function callOllama(messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      think: false,
    }),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`);
  const data = await response.json();
  // Strip <think>...</think> blocks in case model ignores think:false
  return (data.message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function buildSystemMessage(session) {
  const parts = [systemCore()];
  if (session.worldPrompt) parts.push(session.worldPrompt);
  if (session.charPrompt) parts.push(session.charPrompt);
  return parts.join('\n\n');
}

function buildPlayerList(queue) {
  return queue
    .map((u) => {
      const role = u.role ? ` (บทบาท: ${u.role})` : ' (ยังไม่ได้กำหนดบทบาท)';
      return `${u.displayName}${role} → <@${u.userId}>`;
    })
    .join('\n');
}

function randomEventNote() {
  if (Math.random() > 0.3) return '';
  const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  return `\n\n[คำแนะนำพิเศษสำหรับรอบนี้: ${event}]`;
}

async function generateResponse(session, roundMessages) {
  const playerList = buildPlayerList(session.queue);

  const userMessage =
    `[ผู้เล่นในเซสชัน — ใช้ mention เพื่อพูดถึงผู้เล่นโดยตรง]\n${playerList}\n\n` +
    `[ข้อความรอบนี้]\n` +
    roundMessages.map((m) => `[${m.displayName}]: ${m.content}`).join('\n') +
    randomEventNote();

  const messages = [
    { role: 'system', content: buildSystemMessage(session) },
    ...session.conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const aiContent = await callOllama(messages);

  session.conversationHistory.push({ role: 'user', content: userMessage });
  session.conversationHistory.push({ role: 'assistant', content: aiContent });

  return aiContent;
}

async function generateOpening(session) {
  const playerList = buildPlayerList(session.queue);

  const openingPrompt =
    `[ผู้เล่นในเซสชัน — ใช้ mention เพื่อพูดถึงผู้เล่นโดยตรง]\n${playerList}\n\n` +
    `เริ่มต้นเรื่องราวด้วยฉากเปิดที่งดงามและน่าสนใจ ` +
    `แนะนำตัวละครของผู้เล่นแต่ละคนตามบทบาทที่กำหนด ` +
    `และพูดถึงผู้เล่นคนแรกโดยตรงเพื่อเปิดการผจญภัย`;

  const messages = [
    { role: 'system', content: buildSystemMessage(session) },
    { role: 'user', content: openingPrompt },
  ];

  const aiContent = await callOllama(messages);

  session.conversationHistory.push({ role: 'user', content: openingPrompt });
  session.conversationHistory.push({ role: 'assistant', content: aiContent });

  return aiContent;
}

module.exports = { generateResponse, generateOpening };
