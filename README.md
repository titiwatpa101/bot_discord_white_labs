# Snakebell Bot

Discord bot สำหรับเซิร์ฟเวอร์ RP — มีระบบโรลเพลย์ AI, ห้อง Voice อัตโนมัติ, เกม UNO, และคำสั่งอื่นๆ

## ฟีเจอร์

### 🎭 RP (Roleplay AI)
ระบบโรลเพลย์แบบ turn-based ผ่าน Google Gemini AI

| คำสั่ง | รายละเอียด |
|---|---|
| `/rp join` | เข้าร่วมคิวโรลเพลย์ |
| `/rp leave` | ออกจากคิว |
| `/rp queue` | ดูลำดับคิว |
| `/rp role <desc>` | กำหนดบทบาทตัวละคร |
| `/rp world <preset>` | เลือกฉาก (dungeon / forest / city / tavern) |
| `/rp char <preset>` | เลือกตัวละคร AI (narrator / villain / mentor / rival) |
| `/rp setmax <n>` | จำกัดจำนวนผู้เล่น (0 = ไม่จำกัด) |
| `/rp start` | เริ่มเซสชัน |
| `/rp stop` | หยุดเซสชัน |
| `/rp skip` | ข้ามเทิร์นผู้เล่นปัจจุบัน |
| `/rp reset` | รีเซ็ตประวัติสนทนา (คิวยังอยู่) |
| `/rp clear` | ล้างทุกอย่าง: คิว + ประวัติ + เซสชัน |
| `/rp open` | เปิด RP Control Panel |
| `/rp info` | ดูสถานะเซสชัน |

---

### 🔊 VC (Auto Voice Channel)
สร้างห้อง Voice อัตโนมัติเมื่อ user เข้าช่อง "สร้างห้อง" ออกหมดแล้วลบทิ้ง

| คำสั่ง | รายละเอียด |
|---|---|
| `/vc setup <channel>` | เพิ่ม voice channel เป็นช่อง "สร้างห้อง" |
| `/vc remove <channel>` | ลบช่อง "สร้างห้อง" ออกจากระบบ |
| `/vc list` | ดูรายการช่อง "สร้างห้อง" ทั้งหมด |
| `/vc panel` | เปิด Control Panel ของห้องตัวเอง |

**Control Panel ในห้อง:**
- 🔒 ล็อก/ปลดล็อกห้อง
- 👁️ ซ่อน/แสดงห้อง
- ✏️ เปลี่ยนชื่อห้อง
- 🔢 จำกัดจำนวนคน
- 👢 Kick ผู้เล่น

**ชื่อห้องที่สร้าง:** ถ้าช่อง "สร้างห้อง" ชื่อ `สร้างห้อง เล่นเกม` → ห้องที่สร้างจะชื่อ `เล่นเกม ของ Username`

---

### 🃏 UNO
สร้างห้องเกม UNO ผ่าน web server

| คำสั่ง | รายละเอียด |
|---|---|
| `/uno` | สร้างห้องเกม UNO ใหม่ (2–4 คน) |

---

### 🌙 AFK

| คำสั่ง | รายละเอียด |
|---|---|
| `!afk` | บอทเข้า voice channel ที่คุณอยู่ (mute) — พิมพ์อีกครั้งเพื่อออก |

---

### 🗑️ Clearchat

| คำสั่ง | รายละเอียด |
|---|---|
| `!clearchat` | ลบทุกข้อความในช่อง (ต้องมีสิทธิ์ Manage Messages) |
| `!clearchat <n>` | ลบ n ข้อความล่าสุด (1–100) |

> ข้อความที่อายุเกิน 14 วัน Discord ไม่อนุญาตให้ bulk delete

---

### 👋 Newbie
ส่งข้อความต้อนรับสมาชิกใหม่อัตโนมัติ

---

## การติดตั้ง

### ต้องการ
- Node.js 18+
- Discord Bot Token
- Google Gemini API Key

### ขั้นตอน

```bash
git clone <repo-url>
cd snakebell-bot
npm install
cp .env.example .env   # แก้ไขค่า env ตามด้านล่าง
npm run deploy         # ลงทะเบียน slash commands กับ Discord
npm start
```

---

## Environment Variables

```env
DISCORD_TOKEN=        # Bot token จาก Discord Developer Portal
CLIENT_ID=            # Application ID ของบอท
GUILD_ID=             # (optional) ถ้าต้องการลง command เฉพาะ server เดียว

GEMINI_API_KEY=       # Google Gemini API Key สำหรับระบบ RP

UNO_SERVER_URL=       # URL ของ uno-game server เช่น https://xxx.up.railway.app

VC_JOIN_CHANNEL_IDS=  # Channel IDs คั่นด้วย , เช่น 123,456 (คงค่าข้าม Railway redeploy)
```

---

## Scripts

```bash
npm start        # รัน bot
npm run dev      # รัน bot แบบ auto-reload (node --watch)
npm run deploy   # ลงทะเบียน slash commands กับ Discord (รันทุกครั้งที่เพิ่ม/แก้คำสั่ง)
```

---

## โครงสร้างโปรเจกต์

```
src/
├── handlers/
│   ├── interactionHandler.js   # จัดการ slash commands, buttons, modals
│   └── messageHandler.js       # จัดการ prefix commands (!afk, !clearchat)
├── systems/
│   ├── rp/                     # ระบบ Roleplay AI
│   ├── vc/                     # ระบบ Auto Voice Channel
│   ├── uno/                    # คำสั่ง /uno
│   ├── afk/                    # คำสั่ง !afk
│   ├── clearchat/              # คำสั่ง !clearchat
│   └── newbie/                 # ระบบต้อนรับสมาชิกใหม่
└── shared/
    ├── utils.js
    ├── csvLogger.js
    └── promptLoader.js
deploy-commands.js              # ลงทะเบียน slash commands
```

---

## Deploy บน Railway

1. Push code ขึ้น GitHub
2. สร้าง service ใหม่ใน Railway → เลือก repo
3. ตั้ง environment variables ตามด้านบน
4. รัน `npm run deploy` ในเครื่องตัวเองครั้งเดียวเพื่อลงทะเบียน slash commands

> **หมายเหตุ:** Railway ใช้ ephemeral filesystem — ไฟล์ที่สร้างระหว่างรันจะหายเมื่อ redeploy  
> ใช้ `VC_JOIN_CHANNEL_IDS` env var เพื่อคงค่า VC config ข้าม redeploy
