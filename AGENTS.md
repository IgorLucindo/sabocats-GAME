# SaboCats — Agent & Architecture Guidelines

This file is the authoritative technical rulebook for AI assistants and developers modifying the SaboCats codebase.

## 1. Architectural Principles

### 1.1 Service Locator
- `GameServices` (`game/src/core/GameServices.js`) is the single global registry.
- All systems and shared components register on `gameServices`. Never inject dependencies through multi-level constructor arguments — resolve them directly via `gameServices`.

### 1.2 System Execution Pipeline
- Systems live in `game/src/systems/`.
- Registered in `GameServices.setupSystems()` with priority ordering used strictly for initialization order:
  - `5`: `MenuSystem` (UI overlays, room panels, voting, scoreboard)
  - `10`: `InputSystem` (raw keyboard/mouse/gamepad polling)
  - `20`: `PhysicsSystem` (velocity integration, gravity, deceleration)
  - `25`: `PlayerControlSystem` (run, jump, wall-slide input translation)
  - `30`: `CollisionSystem` (AABB bounding, `CollisionBlock`, death triggers)
  - `60`: `InteractionSystem` (trigger boundaries, `InteractableArea`)
  - `70`: `ParticleSystem` (pooled particle emission, swap-and-pop)
  - `80`: `CameraSystem` (lerp tracking, bounding, state zoom levels)
  - `85`: `AnimationSystem` (sprite states, frame sequencing)
  - `95`: `CursorSystem` (local and networked cursors)
  - `97`: `MapSystem` (tilemap loading, transitions)
- Systems are functional helpers called explicitly by entities or loop managers. Do not implement a global update-all/render-all loop inside `SystemManager`.

### 1.3 Thin Entity Model
- `Player.js` must remain lightweight. It delegates directly to systems:
  - Physics & Velocity: `physicsSystem`
  - Collision & Hazards: `collisionSystem`
  - Movement Inputs: `playerControlSystem`
  - Sprites & Particles: `animationSystem`
- Player entity logic is strictly limited to personal coordinates, hitbox recalculation, coyote time tracking, canvas boundary checks, and `die()` / `reselectPlayer()` calls.
- Systems must remain entity-agnostic.

### 1.4 State Machine & Synchronization
- `MatchStateMachine` controls match phases: `initial`, `lobby`, `choosing`, `placing`, `playing`, and `scoreboard`.
- State transition authority is strictly server-side.
  - The server transmits `ON_CHANGE_MATCH_STATE`.
  - Clients sync state through `matchStateMachine.setState(state)`.
- Handlers in `game/src/core/states/` must implement `onEnter()`, `onExit()`, `update()`, and `render()`. Do not add query methods.

### 1.5 Runtime Game State Schema
- `gameState` (`game/src/core/GameState.js`) is the single source of truth.
- Allowed operations are strictly `get(dotPath)` and `set(dotPath, value)`.
- No pub/sub emitters, event buses, or arbitrary state resets are permitted on `gameState`.
- `_initialState()` is the immutable schema; attempting to `set()` an undefined key must fail.
- Top-level schema keys: `game`, `time`, `user`, `users`, `characterOptions`, `map`, `match`, `matchSettings`, `choseMaps`, `room`, `settings`.

---

## 2. Server Architecture & Network Wire Protocol

### 2.1 Room Structure
- Scoped broadcasts: All gameplay emits are isolated via `io.to(roomId)`.
- Public server room schema:
  ```js
  server.rooms = {
    [roomId]: {
      id: string,
      hostId: string,
      users: { [socketId]: UserObject },
      match: MatchServer,
      matchSettings: { pointsToWin: number, lives: number, enabledObjects: object }
    }
  };
  ```
* Fixed 15ms tick interval broadcasts `ON_TICK` to each room with full serialized `room.users`.

### 2.2 Wire Protocol Payloads
* **Client to Server Tick (`ON_TICK`):**
```json
{
  "localPlayer": { "position": { "x": 0, "y": 0 }, "currentSprite": "idle", "flipped": false },
  "cursor": { "position": { "x": 0, "y": 0 } }
}
```
* **Player State Sync (`ON_USER_UPDATE_PLAYER`, bidirectional):**
```json
{
  "id": "socket_id",
  "localPlayer": { "id": 1, "loaded": true, "finished": false, "dead": false, "deathType": "default", "lives": 0 },
  "characterOption": { "id": 1 }
}
```
* **Placeable Object Update (`ON_USER_UPDATE_PLACEABLEOBJECT`):**
* Requires duplicate `crateIndex` conflict prevention on the server.
* Emits `ON_CRATE_INDEX_CONFLICT` if multiple players claim the same index.
* **Match Settings & Meta:**
* `ON_UPDATE_MATCH_SETTINGS`: Host updates room config (points to win, lives).
* `ON_USER_UPDATE_NAME`: Client sets display name (max 16 chars).
* `KICK_PLAYER`: Host kicks a target socket ID.
* `ON_USER_VOTE`: Client submits map vote.
* **Networked A/V:**
* `ON_PARTICLE`: Broadcasts particle generation coordinates and keys to all clients in room.
* `ON_SOUND`: Broadcasts sound IDs and spatial coordinates to all clients.
* **Chat:**
* `CHAT_MESSAGE`: Client sends text (max 64 chars).
* `ON_CHAT_MESSAGE`: Server relays text to room for bubble UI rendering.

---

## 3. Strict Coding Anti-Patterns

* **No Emojis:** Do not include emojis in logs, console outputs, or internal comments.
* **No Shims:** Do not write backward-compatibility wrappers. Refactor callers directly.
* **No Dead Code:** Delete superseded methods and unused variables immediately.
* **No Hardcoded Magic Numbers:** Read constants from `GameConfig` via `DataLoader.js` (`game/data/config.json`).

---

## 4. Current Technical Debt & Priorities

* **Touch Input Cleanup:** If keyboard input is detected, disable touch modes immediately to handle touchscreen laptops correctly.
* **Session Cleanup:** On round/match completion, clean all placed objects and restore `characterOptions` assigned to local and remote players.
* **Match Reconnection:** Refactor room tracking to allow disconnected sockets to re-attach to existing rooms during active gamestates.