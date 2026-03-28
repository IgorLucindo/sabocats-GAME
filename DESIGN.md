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
       ▼ (skipped if debug.joinDevRoom = true)
[Start Screen]
  - Press any key to continue
       │
       ▼
[Lobby]
  - Auto-connect to server
  - Auto-create room (or auto-join devRoomId if debug.joinDevRoom)
  - Room panel (#roomPanel) appears top-right: player slots + room code
  - Each player clicks a CharacterOption to load their cat
    · Right-click to deselect (reselectPlayer)
    · debug.autoVote: auto-votes for a map on character select
  - ESC opens main menu:
    · Resume, Join Room (browse/search), Settings (volume)
  - Host uses ESC menu to start the match
       │
       ▼
[CHOOSING state]
  - All players and remote players unloaded (loaded = false); cursors shown
  - Camera zooms out (choosingZoom = 0.8), centered on map
  - ObjectCrate UI appears — each player clicks to pick one placeable object
  - Map vote UI visible; votes tracked in time.mapVotes
  - Transitions when all players have chosen (server-driven)
       │
       ▼
[PLACING state]
  - Camera resets (placingZoom = 1)
  - Each player drags, rotates, and places their object on the map
  - Remote placements visible in real-time via ON_USER_UPDATE_PLACEABLEOBJECT
  - Transitions when all players have placed (server-driven)
       │
       ▼
[PLAYING state]
  - Players spawn at map.spawnArea positions shuffled by match.spawnSeed
  - Run, jump, wall-slide; placed objects and death blocks are active
  - Last cat alive wins; victory recorded to user.points.victories
  - Death → player.dead = true → server tallies and transitions to scoreboard
       │
       ▼
[SCOREBOARD state]
  - Wait waitTime (2s), then scoreboard displays for displayTime (3s)
  - Surviving player(s) awarded a victory point
  - "too easy!" shown if no one died
  - Automatically loops back to CHOOSING
       │
       └──────────────────────────────────────── (loop)
```

**State machine transitions are server-authoritative** — the server emits `ON_CHANGE_MATCH_STATE`; all clients follow via `matchStateMachine.setState(state)`.

---

## 3. Code Architecture Rules

These rules describe how the codebase is structured. Follow them when adding features.

### 3.1 Service Locator
- `GameServices` (`game/src/core/GameServices.js`) is the single global registry.
- All systems and key objects live on `gameServices`. Never pass dependencies through deep call chains — read them directly from `gameServices`.

### 3.2 Systems
Systems live in `game/src/systems/`. Each system handles one concern. Registered in `GameServices.setupSystems()` with a priority number used only for init order.

| Priority | System | Responsibility |
|---|---|---|
| 5 | `MenuSystem` | All overlay UI: main menu, room panel, map vote, scoreboard |
| 10 | `InputSystem` | Raw keyboard/mouse events; exposes `keys` object |
| 20 | `PhysicsSystem` | Gravity, velocity integration, deceleration, air movement |
| 25 | `PlayerControlSystem` | Run / jump / wall-slide input processing |
| 30 | `CollisionSystem` | AABB collision; `CollisionBlock` lives here |
| 60 | `InteractionSystem` | Interactable areas; `InteractableArea` lives here |
| 70 | `ParticleSystem` | Particle pool (swap-and-pop, pooled by type) |
| 80 | `CameraSystem` | Pan / zoom / lerp |
| 85 | `AnimationSystem` | Sprite state machine + particle emission triggers |
| 95 | `CursorSystem` | In-game cursor; remote user cursor logic |
| 97 | `MapSystem` | Map loading, voting, transitions |

Systems are **utility helpers** — called by entities (e.g. `Player.update()`), not by the game loop. `SystemManager` is used only for `initializeAll()`. Do not add an update-all or render-all pipeline to SystemManager — the manual pipeline in `GameLoop` is intentional.

### 3.3 Player / Entity Logic
- `Player.update()` delegates entirely to systems:
  - `playerControlSystem.processInput(this, keys)` — input → velocity
  - `physicsSystem.decelerate / applyAirMovement / applyHorizontalVelocity / applyVerticalVelocity`
  - `collisionSystem.checkHorizontalCollisions / checkVerticalCollisions` — with `onDeathBlock` callback
  - `animationSystem.updateSprite / updateParticles`
- The only logic that stays in `Player` is player-specific: hitbox/camerabox update, coyote time (3 lines), canvas boundary check, `die()`, `reselectPlayer()`.
- Systems must be entity-agnostic — they operate on any object with the right shape, not exclusively on `Player`.

### 3.4 State Machine
- `MatchStateMachine` drives round flow: `choosing` → `placing` → `playing` → `scoreboard`.
- State logic lives in handler classes under `game/src/core/states/`.
- State handlers implement: `onEnter`, `onExit`, `update`, `render`. No `query()` method.
- Transitions are **server-authoritative** — the server emits `ON_CHANGE_MATCH_STATE`; all clients call `matchStateMachine.setState(state)` together.

### 3.5 Game State
- `gameState` (`game/src/core/GameState.js`) is the single source of truth for all runtime state.
- API is `get(dotPath)` and `set(dotPath, value)` only. No pub/sub, no reset.
- Do not store game state in system instances or in module-level variables.
- All paths are raw strings. `_initialState()` is the authoritative schema — `set()` throws if a path is not defined there.

**Schema top-level keys:** `game`, `time`, `user`, `users`, `characterOptions`, `map`, `match`, `choseMaps`, `room`, `settings`

### 3.6 Config (`game/data/config.json`)

All magic numbers belong here. Access via `GameConfig` from `game/src/core/DataLoader.js`.

| Section | Notable keys |
|---|---|
| `debug` | `enabled`, `keepCursor`, `joinDevRoom`, `devRoomId`, `autoVote`, `autoVoteMap` |
| `rendering` | `pixelScale`, `tileSize`, `tickTime` |
| `physics` | `gravity`, `maxFallSpeed`, fall/peak multipliers |
| `movement` | `walk`/`run` acceleration + maxVelocity, `deceleration` |
| `jump` | `jumpVelocity`, `coyoteTime`, `jumpBuffer`, wall-slide values |
| `camera` | lerp speeds, zoom limits, `choosingZoom`, `placingZoom` |
| `scoreboard` | `waitTime`, `displayTime` |
| `mapTransition` | `closeTime`, `openTime` |
| `mouse` | `cameraboxWidth/Height`, `edgePanZone`, `edgePanMaxSpeed` |
| `objectCrate` | scale, width, object area dimensions/offsets |
| `ui` | `keySprite` size, offset, frameRate, frameBuffer |
| `room` | `maxPlayers`, `codeLength` |
| `player` | hitbox and camerabox dimensions/offsets |

### 3.7 Room System

```
server.rooms = { [roomId]: { id, hostId, users: {}, match: MatchServer } }
socket.roomId  // current room per socket (null if not in one)
```

- All game broadcasts scoped to `io.to(room.id)` — no global emits.
- Single `setInterval` iterates all rooms and broadcasts `ON_TICK` per room every 15ms.
- When `debug.joinDevRoom` is true, the client skips the start screen and auto-joins `debug.devRoomId` on connect. If the room doesn't exist yet, it is created with that exact code.

**Room events:**

| Direction | Event | Purpose |
|---|---|---|
| C → S | `CREATE_ROOM` | Create room (optional fixed code) |
| C → S | `JOIN_ROOM` | Join by code |
| C → S | `KICK_PLAYER` | Host kicks a player |
| C → S | `GET_ROOMS` | Request public room list |
| S → C | `ROOM_CREATED` | Room created; `{ roomId, hostId }` |
| S → C | `ROOM_JOINED` | Joined; same payload |
| S → C | `ROOM_NOT_FOUND` / `ROOM_FULL` | Join errors |
| S → C | `ROOMS_LIST` | Array of `{ id, playerCount, maxPlayers }` |
| S → C | `ON_KICKED` | Triggers page reload |
| S → C | `ON_HOST_CHANGED` | New host `{ hostId }` |

### 3.8 Wire Protocol (per-tick)

**Client → Server (`ON_TICK`, rate-limited to `network.playerUpdateInterval`):**
```js
{ localPlayer: { position, currentSprite }, cursor: { position } }
```

**Server → Client (`ON_TICK` broadcast, every 15ms):**
Full `room.users` object — all players' positions, cursors, points.

**Player state sync (`ON_USER_UPDATE_PLAYER`, bidirectional):**
```js
{ id, localPlayer: { id, loaded, finished, dead }, characterOption: { id } }
```

### 3.9 General Rules
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
