# VC System (Auto Voice Channel)

ระบบสร้างห้อง voice อัตโนมัติ — กำลังจะสร้างในอนาคต

## ไฟล์ที่จะสร้าง

```
src/systems/vc/
├── command.js        ← slash command /vc
├── vcManager.js      ← จัดการ voice channel state (ห้องไหนเป็นของใคร)
├── handler.js        ← handleCommand, handleButton, handleSelect, handleModal
└── messageHandler.js ← (ถ้ามีการจัดการ message ใน vc)
```

## Features ที่วางแผนไว้

- ใครเข้า "➕ สร้างห้อง" → บอทสร้าง voice ชื่อ `🔊-⋆⑅˚₊ห้องแหกปากของ <username>`
- Control Panel ใน voice text chat ของห้องนั้น
- ปุ่ม: 🔒 ล็อก / 👁️ ซ่อน / 🔢 จำกัดคน / ✏️ เปลี่ยนชื่อ / 👢 Kick
- เจ้าของห้องเท่านั้นกดปุ่มได้
- ออกหมด → ลบห้องอัตโนมัติ
- slash command ดึง panel กลับขึ้นมาได้
