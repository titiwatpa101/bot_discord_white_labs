# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` / `node index.js` — run the bot
- `npm run dev` — run with `--watch` (auto-restart on file changes)
- `npm run deploy` / `node deploy-commands.js` — register slash commands with Discord API (required after adding/changing command definitions)
- VPS uses PM2: `pm2 restart snakebell-bot`

**After changing any `command.js` file, always run `node deploy-commands.js` before testing.**

## Architecture

Discord.js v14 bot with modular system architecture. Each feature lives in `src/systems/<name>/` with a consistent structure.

### Entry Points

- `index.js` — client setup, event bindings, scheduler initialization
- `src/handlers/interactionHandler.js` — routes all interactions (commands, buttons, selects, modals) by prefix to system handlers
- `src/handlers/messageHandler.js` — routes text messages (`!` prefix commands)

### System Structure

Each system in `src/systems/<name>/` follows this pattern:
- `command.js` — SlashCommandBuilder definition (auto-discovered by `deploy-commands.js`)
- `handler.js` — interaction handlers (handleButton, handleSelect, handleModal, etc.)
- `adminHandler.js` — slash command handler (if separate from interaction handler)
- `managers/<name>Manager.js` — data persistence layer (JSON file read/write)
- `panels/<name>Panel.js` — Discord embed/button/row builders
- `public/<name>Public.js` — functions for updating persistent panel messages

### Interaction Routing Convention

CustomIds use prefixes to route to the correct system handler:
- `rp_`, `vc_`, `verify_`, `pet_`, `petsel_` — respective systems
- `tk_`, `tksel_`, `tkusr_`, `tkmodal_` — ticket system
- `cal_`, `calsel_`, `calmodal_` — calendar system

State is encoded in customIds (e.g., `cal_nav_202606` encodes year+month). Multi-step flows use server-side `Map()` sessions keyed by `${guildId}_${userId}`.

### Data Persistence

- Runtime data stored as JSON in each system's `data/` subdirectory
- `data/` directories are gitignored — `save()` functions must call `mkdirSync({ recursive: true })` before `writeFileSync`
- Exception: `src/systems/pet/data/catalog.json` is tracked in git (pet definitions)
- The catalog.json on VPS may have `imageUrl` fields set — when updating catalog, preserve those values

### Adding a New System

1. Create `src/systems/<name>/command.js` with SlashCommandBuilder export
2. Create handler files following existing patterns
3. Add routing in `src/handlers/interactionHandler.js` — import handler and add prefix checks for each interaction type
4. If system has message commands, add to `src/handlers/messageHandler.js`
5. If system needs a scheduler, add `startScheduler(client)` call in `index.js` ready event
6. Run `node deploy-commands.js`

### Pet System Specifics

- `catalog.json` defines all pets with rarity, spawn weights, pricing, and market parameters
- Rarity tiers: common → uncommon → rare → epic → legendary
- `petManager.js` handles per-user inventory; `spawnManager.js` handles wild pet spawns
- `enhanceManager.js` handles pet enhancement (+1 to +10 system)
- `peekCounter/commitCounter` pattern in ticket system: peek before action, commit only after success
- Message commands (`!pet`, `!market`, etc.) go through `messageCommand.js` → sends ephemeral-style panels

### Calendar System

- Uses `@napi-rs/canvas` to render calendar as PNG image
- Scheduler checks every 60s for booking notifications at configured time
- Notification embeds have acknowledge button; acknowledging removes the booking

## Language

Bot UI text is in Thai. Code comments and identifiers are in English.
