# 🐍 Snakebell Bot

Discord bot สำหรับเซิร์ฟเวอร์ — มีสองระบบหลัก ออกแบบแบบ modular เพิ่มระบบใหม่ได้โดยไม่กระทบระบบเดิม

---

## ✨ ระบบที่มี

### 🎭 RP — Roleplay แบบผลัดคิว + AI
- ผู้เล่นเข้าคิวและผลัดกันส่งข้อความตามลำดับ
- ครบทุกคนในคิว → **Google Gemini AI** ตอบเนื้อเรื่องและแท็กคิวถัดไปอัตโนมัติ
- ระบบ 4-Layer Prompt (Core → World → Character → User)
- Control Panel แบบ button/select สำหรับจัดการ session
- บันทึก log ทุกข้อความเป็น CSV

### 🔊 VC — Auto Voice Channel
- ใครเข้าห้อง "สร้างห้อง" → บอทสร้างห้อง voice ส่วนตัวให้ทันที
- ออกจากห้องหมด → ลบห้องอัตโนมัติ
- เจ้าของห้องควบคุมผ่าน Control Panel: 🔒 Lock / 👁️ Hide / 🔢 Limit / ✏️ Rename / 👢 Kick

---

## 📋 Requirements

- **Node.js** 18+
- **Discord Bot Token** — [discord.com/developers](https://discord.com/developers)
- **Google Gemini API Key** — [aistudio.google.com](https://aistudio.google.com) (ฟรีสำหรับการทดสอบ)

---

## ⚙️ Setup

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. สร้างไฟล์ `.env`
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_guild_id_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> `GUILD_ID` — ใส่เพื่อให้ slash commands ลงทะเบียนใน guild ทันที (แนะนำตอน dev)  
> ถ้าไม่ใส่ → commands ลงทะเบียนแบบ global (ใช้ได้ทุก server แต่รอนานถึง 1 ชั่วโมง)

### 3. เปิด Privileged Gateway Intents

ไปที่ [Discord Developer Portal](https://discord.com/developers) → เลือก App → **Bot** → เปิด:
- ✅ **Message Content Intent**

### 4. ลงทะเบียน Slash Commands (รันครั้งเดียว หรือทุกครั้งที่แก้ไข command)
```bash
npm run deploy
```

### 5. เริ่มบอท
```bash
npm start
```

> **dev mode** (auto-restart เมื่อแก้ไขไฟล์): `npm run dev`

---

## 🔧 ตั้งค่า VC System

หลังจากบอทออนไลน์:

1. สร้าง **Voice Channel** สำหรับใช้เป็นห้อง "Join to Create" (เช่น `➕ สร้างห้อง`)
2. ใช้คำสั่ง `/vc setup #channel` → เลือกห้องที่สร้างไว้
3. ทดสอบโดยเข้าห้องนั้น → บอทจะสร้างห้อง voice ใหม่ให้ทันที

> **Bot permissions** ที่ต้องมีใน category: `Manage Channels` · `Move Members` · `Connect` · `View Channel` · `Send Messages`

---

## 📖 Commands

### 🔊 `/vc` — ระบบ Voice Channel

| คำสั่ง | สิทธิ์ | คำอธิบาย |
|---|---|---|
| `/vc setup <channel>` | Manage Channels | ตั้งค่าห้อง "สร้างห้อง" |
| `/vc panel` | เจ้าของห้อง | เปิด Control Panel ใหม่ (ถ้าแชทจม) |

**ปุ่มใน Control Panel** (เจ้าของห้องเท่านั้น):

| ปุ่ม | การทำงาน |
|---|---|
| 🔒 Lock / 🔓 Unlock | ล็อก/ปลดล็อกห้อง (คนอื่นเข้าไม่ได้) |
| 🙈 Hide / 👁️ Show | ซ่อน/แสดงห้องในรายการ |
| 🔢 Limit | กำหนดจำนวนคนสูงสุด (0 = ไม่จำกัด) |
| ✏️ Rename | เปลี่ยนชื่อห้อง |
| 👢 Kick | เลือก kick คนออกจากห้อง |

---

### 🎭 `/rp` — ระบบ Roleplay

#### Setup
| คำสั่ง | คำอธิบาย |
|---|---|
| `/rp world <preset>` | **[Layer 2]** เลือกฉาก: `dungeon` · `forest` · `city` · `tavern` |
| `/rp char <preset>` | **[Layer 3]** เลือกตัวละคร AI: `narrator` · `villain` · `mentor` · `rival` |
| `/rp setmax <n>` | จำกัดจำนวนผู้เล่น (`0` = ไม่จำกัด) |

#### Queue
| คำสั่ง | คำอธิบาย |
|---|---|
| `/rp join` | เข้าร่วมคิว |
| `/rp leave` | ออกจากคิว |
| `/rp role <description>` | **[Layer 4]** กำหนดบทบาทตัวละครของตัวเอง |
| `/rp queue` | ดูรายชื่อและลำดับคิว |

#### Session Control
| คำสั่ง | คำอธิบาย |
|---|---|
| `/rp start` | เริ่ม session — AI สร้างฉากเปิด |
| `/rp stop` | หยุด session (คิวและประวัติยังอยู่) |
| `/rp skip` | ข้ามเทิร์นผู้เล่นปัจจุบัน |
| `/rp reset` | ล้างประวัติสนทนา AI (คิวยังอยู่) |
| `/rp info` | ดูสถานะ session |
| `/rp clear` | ล้างทุกอย่าง — คิว + ประวัติ + session |
| `/rp open` | เปิด Control Panel (ปุ่มทั้งหมดในที่เดียว) |

#### วิธีเล่น RP
```
1. /rp world dungeon          ← เลือกฉาก
2. /rp char villain           ← เลือกตัวละคร AI
3. ผู้เล่นทุกคน /rp join
4. (ไม่บังคับ) /rp role นักดาบที่สูญเสียความทรงจำ
5. /rp start                  ← AI สร้างฉากเปิดและแท็กคิวที่ 1

ตัวอย่าง (คิว: Gus → Why):
  Gus พิมพ์ข้อความ  → บอทแท็ก @Why
  Why พิมพ์ข้อความ  → AI ตอบเนื้อเรื่อง → แท็ก @Gus ใหม่
  (วนซ้ำ)
```

---

## 🗂️ โครงสร้างไฟล์

```
├── index.js                              ← entry point + Discord client
├── deploy-commands.js                    ← ลงทะเบียน slash commands
├── .env                                  ← secrets (ไม่ commit)
├── .env.example                          ← template สำหรับ env vars
│
├── prompts/                              ← AI prompt files (ไม่ต้องแก้ code)
│   ├── system_core.txt                   ← Layer 1: กฎพื้นฐาน
│   ├── worlds/
│   │   ├── dungeon.txt / forest.txt / city.txt / tavern.txt
│   └── characters/
│       ├── narrator.txt / villain.txt / mentor.txt / rival.txt
│
├── data/
│   └── vc_config.json                    ← ตั้งค่า VC per guild (auto-generated)
│
├── logs/
│   └── rp_messages.csv                   ← log ข้อความ RP ทั้งหมด (auto-generated)
│
└── src/
    ├── handlers/
    │   ├── interactionHandler.js         ← router: slash/button/select/modal
    │   └── messageHandler.js             ← router: message events
    │
    ├── shared/
    │   ├── utils.js                      ← splitMessage (2000 char limit)
    │   ├── csvLogger.js                  ← บันทึก CSV
    │   └── promptLoader.js               ← โหลด prompt files
    │
    └── systems/
        ├── rp/                           ← ระบบ Roleplay
        │   ├── command.js                ← slash command definition
        │   ├── handler.js                ← interaction handlers
        │   ├── messageHandler.js         ← message turn logic
        │   ├── sessionManager.js         ← queue & session state
        │   ├── aiService.js              ← Gemini API
        │   └── panel.js                  ← UI builder
        │
        └── vc/                           ← ระบบ Voice Channel
            ├── command.js                ← slash command definition
            ├── handler.js                ← interaction handlers
            ├── voiceStateHandler.js      ← create/delete room logic
            ├── vcManager.js              ← room registry + config
            └── panel.js                  ← UI builder
```

### เพิ่มระบบใหม่
1. สร้างโฟลเดอร์ `src/systems/<name>/` พร้อมไฟล์ `command.js` + `handler.js`
2. เพิ่ม import และ routing ใน `src/handlers/interactionHandler.js` 1 บรรทัด
3. `deploy-commands.js` จะ auto-discover `command.js` ใหม่ทันที

---

## 📊 CSV Log (RP)

ข้อความทุกข้อความระหว่าง session ถูกบันทึกที่ `logs/rp_messages.csv`

| คอลัมน์ | คำอธิบาย |
|---|---|
| `timestamp` | เวลา ISO 8601 |
| `channelId` | Discord Channel ID |
| `userId` | Discord User ID |
| `username` | username |
| `displayName` | ชื่อที่แสดงใน server |
| `content` | ข้อความที่ส่ง |

> ไฟล์ใช้ **UTF-8 BOM** — เปิดด้วย Excel ได้โดยตรง ภาษาไทยแสดงถูกต้อง

---

## 📝 Notes

- **VC rooms** หายหลัง bot restart (in-memory) แต่ห้องว่างจะถูกลบอัตโนมัติตอน voiceStateUpdate ครั้งถัดไป
- **RP sessions** หายหลัง restart เช่นกัน (in-memory by design)
- **Discord rename rate-limit**: เปลี่ยนชื่อห้องได้ 2 ครั้ง/10 นาที
- **Lock ไม่กระทบเจ้าของห้อง** — owner มี explicit Allow เสมอ
