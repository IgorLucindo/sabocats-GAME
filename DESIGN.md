# Criminal CATastrophe — Design Reference

This file is the single source of truth for game design, architecture rules, art direction, and lore.
Intended for both developers and AI assistants working on this codebase.

---

## 1. Overview

**Criminal CATastrophe** is a **2D side-view multiplayer platformer**.

- 2–4 players connect online and compete in short rounds on a shared map.
- Each round, players race to be the last cat standing.
- Between rounds, players choose and place objects on the map before gameplay begins.
- The game is browser-based, built with vanilla JavaScript + Canvas API + Socket.IO.

---

## 2. Game Flow

```
[Browser loads]
       │
       ▼
[Login / Connect to server]
       │
       ▼
[Lobby — waiting for players]
  (game.inLobby = true)
  - Players see the map
  - Players right-click to reselect their cat character
  - Map vote UI visible
       │
       ▼
[CHOOSING state]
  - ObjectCrate UI appears at center
  - Each player clicks to choose one placeable object (e.g. crate, saw)
  - Camera zooms out (choosingZoom = 0.8)
  - Ends when all players have chosen
       │
       ▼
[PLACING state]
  - Camera resets to map start (placingZoom = 1)
  - Each player uses their cursor to drag and place their chosen object onto the map
  - Ends when all players have placed their object
       │
       ▼
[PLAYING state]
  - 2-minute timer (mafia hurries the cats)
  - Players run, jump, and wall-slide to eliminate each other
  - Death blocks and placed objects affect gameplay
  - Last cat alive wins; if timer runs out, remaining cats survive
       │
       ▼
[SCOREBOARD state]
  - Short wait (waitTime = 2s), then scoreboard appears (displayTime = 3s)
  - Points awarded: surviving cat(s) get a victory
  - Automatically transitions back to CHOOSING after display time
       │
       └──────────────────────────────────────────────────┐
                                                           │
                                              (loop back to CHOOSING)
```

**State machine transitions are server-authoritative** — the server sends `changeState` events; clients follow.

---

## 3. Code Architecture Rules

These rules describe how the codebase is structured. Follow them when adding features.

### 3.1 Service Locator
- `GameServices` (`game/src/core/GameServices.js`) is the single global registry.
- All systems and key objects live on `gameServices`. Never pass dependencies through deep call chains — read them directly from `gameServices`.

### 3.2 Systems
- Systems live in `game/src/systems/`. Each system handles one concern.
- Systems are registered in `GameServices.setupSystems()` with a priority number (used only for init order).
- Systems are **utility helpers** — they are called by entities (e.g. `Player.update()`), not by the game loop.
- `SystemManager` is used only for `initializeAll()`. It does **not** drive the update loop.
- Do not add an update-all or render-all pipeline to SystemManager. The manual pipeline in `GameLoop` is intentional.

### 3.3 Player / Entity Logic
- `Player.update()` delegates entirely to systems:
  - `playerControlSystem.processInput(this, keys)` — input → velocity
  - `physicsSystem.decelerate / applyAirMovement / applyHorizontalVelocity / applyVerticalVelocity`
  - `collisionSystem.checkHorizontalCollisions / checkVerticalCollisions` — with `onDeathBlock` callback
  - `animationSystem.updateSprite / updateParticles`
- The only logic that stays in `Player` is player-specific: hitbox/camerabox update, coyote time (3 lines), canvas boundary check, `die()`, `reselectPlayer()`.
- Systems must be entity-agnostic — they operate on any object with the right shape, not exclusively on `Player`.

### 3.4 State Machine
- `MatchStateMachine` drives round flow: choosing → placing → playing → scoreboard.
- State logic lives in handler classes under `game/src/core/states/`.
- State handlers implement: `onEnter`, `onExit`, `update`, `render`. No `query()` method.
- Transitions are triggered by the server via `socketHandler.sendChangeState(stateName)`.

### 3.5 Game State
- `gameState` (`game/src/core/GameState.js`) is the single source of truth for all runtime state.
- API is `get(dotPath)` and `set(dotPath, value)` only. No pub/sub, no reset.
- Do not store game state in system instances or in module-level variables.
- All paths are raw strings. `_initialState()` is the authoritative schema — `set()` throws if a path is not defined there.

### 3.6 Config
- All magic numbers belong in `game/data/config.json`.
- Access via the `GameConfig` export from `game/src/core/DataLoader.js`.
- Sections: `debug`, `rendering`, `physics`, `movement`, `jump`, `particles`, `network`, `camera`, `scoreboard`, `mapTransition`, `mouse`, `box`, `ui`, `player`.

### 3.7 General Rules
- No dead code. Remove methods that are never called.
- No backward-compatibility shims. Change the code directly.
- No emoji in logger or console calls.
- Keep `Player.js` thin — if logic generalizes to any entity, it belongs in a system.

---

## 4. Art Style

- **Pixel art**, approximately **8×8 base tile size**, scaled up for screen.
- Visual reference: *Nobody Saves the World* — but as **pixel art**. Exaggerated shapes, bold outlines, chunky sprites.
- **Camera**: fixed side-view (2D platformer perspective). No rotation.
- **Tone**: funny, goofy, cartoonish. Characters are expressive cats. Humor is central.
- **Color palette**: vibrant, slightly saturated. Not pastel, not dark. Think colorful criminal underworld.
- **Animations**: should feel bouncy and snappy. Idle animations have personality (blinking, tail flick, etc.).
- **UI**: pixel-font where possible. Chunky buttons. Consistent with the goofy tone.
- **Rendering note**: render pixel art at native low resolution then scale up with `imageSmoothingEnabled = false` on the canvas context to preserve crisp pixels.

---

## 5. Lore

> *To be expanded later. This is the canonical draft.*

**Setting**: A city run by a powerful crime boss — the Mafia Rat.

**Story start**:
A group of cats is living their normal lives when they get ambushed by the Mafia Rat and his gang.
The Rat gives them a choice: work for him, or disappear.
The cats have no option. They're now on the Mafia Rat's payroll.

**Each match**:
The Mafia Rat has a target — someone who owes him, someone in the way, someone who knows too much.
He sends all his cats after it. Only one cat gets the reward.
The others? The Rat can't have loose ends. They're taken out by the mafia.

**During play** (the 2-minute timer):
The Mafia Rat is watching. He's impatient.
If the cats take too long, he starts hurrying them — pressure, threats, chaos.
The timer represents the Rat losing his patience.

**Win condition**:
The cat that survives (last alive, or surviving when time runs out) completed the job.
They get the reward and live to see another day.
Everyone else answers to the Rat.

---
