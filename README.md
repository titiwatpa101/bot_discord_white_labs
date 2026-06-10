# Snakebell Bot

Discord bot สำหรับเซิร์ฟเวอร์ RP — มีระบบโรลเพลย์ AI, ห้อง Voice อัตโนมัติ, เกม UNO, ระบบ Verify และคำสั่งอื่นๆ

## ฟีเจอร์

### 🐾 Pet System (ระบบสัตว์เลี้ยง)
ระบบเลี้ยงสัตว์ครบวงจร — จับ, เทรน, ซื้อขาย, Wonder Trade พร้อม Dynamic Economy

**User Commands (`!` prefix):**

| คำสั่ง | หน้าที่ |
|---|---|
| `!pet` | เปิด Panel หลัก (auto-delete 5 นาที) |
| `!market` | เปิด Panel ตรงหน้าตลาด |
| `!trade` | เปิด Panel ตรงหน้า Wonder Trade |

**Panel Navigation (ทุกอย่างอยู่ใน panel):**
- 📦 **คลังสัตว์** — ดูสัตว์ทั้งหมด, เลือกดู detail
- ⭐ **Set Active** — เซ็ตสัตว์ที่ต้องการอยู่ slot #1 (รับ EXP)
- 🍖 **ให้อาหาร** — เลือกอาหารจาก inventory → Active pet รับ EXP
- 💰 **ลงขาย** — เลือกราคาและลง listing ในตลาด
- 🔀 **Wonder Trade** — ส่งสัตว์เข้าพูล แลกสุ่มกับคนอื่น
- 🏪 **ร้านค้า** — ซื้ออาหาร (หญ้า/เนื้อ/พิเศษ)
- 📊 **ตลาด** — ดู listing, ซื้อสัตว์จากผู้เล่นคนอื่น

**Admin Commands (`/pet`):**

| คำสั่ง | หน้าที่ |
|---|---|
| `/pet spawn setup <channel> [interval]` | ตั้งช่อง spawn + ความถี่ (นาที, default 30) |
| `/pet spawn remove <channel>` | ลบช่อง spawn |
| `/pet spawn trigger` | บังคับ spawn ทันที (ทดสอบ) |
| `/pet market setup <channel>` | ส่ง public market panel |
| `/pet wondertrade setup <channel>` | ส่ง public Wonder Trade panel |
| `/pet give <user> <species>` | ให้สัตว์แก่ผู้ใช้ (debug) |
| `/pet coins <user> <amount>` | ให้ coins แก่ผู้ใช้ (debug) |

**ระบบ EXP & Level:**
- EXP ไปที่สัตว์ใน slot #1 (Active) เสมอ
- แหล่ง EXP: ให้อาหาร, จับจาก spawn (+15), รับจาก Wonder Trade (+30)
- `expToNext = 100 × level^1.5`

**Spawn System:**
- Bot สุ่ม spawn สัตว์ตามช่วงเวลาที่ตั้งไว้
- กดปุ่ม **จับเลย!** ภายใน 5 นาที — คนแรกได้สัตว์
- ความหายาก: ⭐LEGENDARY(1%) 💜EPIC(4%) 🔷RARE(10%) 🟢UNCOMMON(25%) ⚪COMMON(60%)

**Wonder Trade:**
- ส่งสัตว์เข้า pool → ได้รับสัตว์สุ่มจากคนอื่น
- Public panel อัปเดต realtime เมื่อ pool เปลี่ยน
- ถ้ามีคนรอ match อยู่ → แลกทันที

**Dynamic Economy:**
- ราคาปรับจาก 6 ปัจจัย: Supply, Demand (EMA), Momentum, Liquidity, Mean Reversion, Noise
- Anti-manipulation: Diminishing returns + Wash trade detection
- Random market events ทุก 6-12 ชั่วโมง
- Market state: 📈 BULL / 📉 BEAR / ➡️ STABLE / 〰️ VOLATILE
- Public market panel อัปเดต realtime เมื่อมีการซื้อขาย

**อาหาร:**
| อาหาร | ราคา | EXP |
|---|---|---|
| 🌿 หญ้าธรรมดา | 10 coins | +10 |
| 🍖 เนื้อสด | 50 coins | +50 |
| ✨ อาหารพิเศษ | 200 coins | +200 |

**สัตว์เริ่มต้นใน Catalog:**
| Species | Rarity | ราคาฐาน |
|---|---|---|
| 🐉 มังกรไฟ | ⭐ LEGENDARY | 5,000c |
| 🐺 หมาป่าเงา | 💜 EPIC | 2,000c |
| 🦋 ผีเสื้อน้ำแข็ง | 🔷 RARE | 800c |
| 🦊 จิ้งจอกวิญญาณ | 🟢 UNCOMMON | 300c |
| 🐱 แมวส้ม | ⚪ COMMON | 100c |

> เพิ่ม/แก้สัตว์ได้ที่ `src/systems/pet/data/catalog.json`

---



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
- ✅ Allow — อนุญาต user เข้าได้แม้ห้องล็อก/ซ่อน (กดซ้ำเพื่อยกเลิก)
- 🚫 Block — บล็อก user ไม่ให้เห็นและเข้าห้อง + kick ออกทันที (กดซ้ำเพื่อยกเลิก)

**ชื่อห้องที่สร้าง:** ถ้าช่อง "สร้างห้อง" ชื่อ `สร้างห้อง เล่นเกม` → ห้องที่สร้างจะชื่อ `เล่นเกม ของ Username`

---

### ✅ Verify (ระบบยืนยันสมาชิก)
ระบบ self-verify พร้อมตรวจสอบอายุบัญชี Discord

| คำสั่ง | รายละเอียด |
|---|---|
| `/verify setup role: button: min_days:` | ตั้งค่าและส่งข้อความยืนยันไปยังช่องนี้ |
| `/verify send` | ส่งข้อความยืนยันใหม่ (ใช้ config เดิม) |

- ข้อความและปุ่ม custom ได้ทั้งหมด
- ตรวจสอบอายุบัญชี Discord ขั้นต่ำ (default 30 วัน)
- ให้ Role อัตโนมัติเมื่อยืนยันสำเร็จ

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
| `!clearchat` | ลบทุกข้อความในช่อง (วนลบทีละ 100) |
| `!clearchat <n>` | ลบ n ข้อความล่าสุด (1–100) |
| `!clearchat stop` | หยุดการลบกลางทาง |

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
cd bot_discord_white_labs
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

VC_JOIN_CHANNEL_IDS=  # Channel IDs คั่นด้วย , เช่น 123,456 (คงค่าข้าม redeploy)

NEWBIE_ROLE_ID=       # Role ID สำหรับระบบเด็กใหม่
NEWBIE_DURATION_MS=86400000  # ระยะเวลาถือ role เด็กใหม่ (ms) default 24h
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
│   ├── vc/                     # ระบบ Auto Voice Channel + Allow/Block
│   ├── verify/                 # ระบบยืนยันสมาชิก
│   ├── pet/                    # ระบบสัตว์เลี้ยง + Dynamic Economy
│   │   ├── data/               # catalog.json, users.json, market.json, wondertrade.json
│   │   ├── managers/           # petManager, marketManager, wonderTradeManager, spawnManager
│   │   ├── panels/             # panel builders (main, pets, detail, shop, market, trade, feed, sell)
│   │   ├── public/             # realtime public panel updaters
│   │   ├── handler.js          # button + select interaction router
│   │   ├── adminHandler.js     # /pet slash command handler
│   │   ├── messageCommand.js   # !pet !market !trade
│   │   └── command.js          # slash command definition
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

## Deploy บน Windows VPS

```cmd
git clone https://github.com/titiwatpa101/bot_discord_white_labs.git
cd bot_discord_white_labs
npm install
notepad .env        # ใส่ค่า env ทั้งหมด
npm install -g pm2
pm2 start index.js --name snakebell-bot
pm2 save
pm2-startup install
```

### Auto-deploy เมื่อ push GitHub
ใช้ GitHub Actions + SSH — ไฟล์ `.github/workflows/deploy.yml` ตั้งค่าไว้แล้ว

ตั้ง Secrets ใน GitHub repo → Settings → Secrets and variables → Actions:

| Secret | ค่า |
|---|---|
| `VPS_HOST` | IP ของ VPS |
| `VPS_USER` | `Administrator` |
| `VPS_SSH_KEY` | Private key (`-----BEGIN OPENSSH PRIVATE KEY-----` ทั้งก้อน) |

---

## Deploy บน Railway

1. Push code ขึ้น GitHub
2. สร้าง service ใหม่ใน Railway → เลือก repo
3. ตั้ง environment variables ตามด้านบน
4. รัน `npm run deploy` ในเครื่องตัวเองครั้งเดียวเพื่อลงทะเบียน slash commands

> ใช้ `VC_JOIN_CHANNEL_IDS` env var เพื่อคงค่า VC config ข้าม redeploy
