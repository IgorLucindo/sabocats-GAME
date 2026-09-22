# SaboCats — Game Design Document

## 1. Overview

SaboCats is a 2D side-view multiplayer competitive platformer. Four players connect online and compete in short rounds on a shared map. Between rounds, players choose and place objects to either eliminate opponents or secure their own path to victory.

---

## 2. Match Game Flow

```
[Start Screen] -> Press any key (skips if debug.joinDevRoom = true)
|
[Lobby State]
-Players auto-connect, room code generated, character selection.
-Host can configure matchSettings (pointsToWin, lives, enabledObjects).
-Players can use text chat (rendered as in-game speech bubbles).
-Host triggers match start.
│
▼
[CHOOSING State]
-Unload player models, display local/networked cursors.
-Camera zooms out to choosingZoom (0.8) centered on the map.
-ObjectCrate UI opens; each player selects one item.
-Interactive map globe voter allows players to select the next arena.
-Advances when all players confirm item selection.
│
▼
[PLACING State]
-Camera resets to placingZoom (1.0).
-Players position, rotate, and place their chosen object.
-Real-time placement synchronization.
-Advances when all players confirm placement.
│
▼
[PLAYING State]
-Forced movement cinematic: characters leave cages and enter the map.
-Players spawn at spawnArea locations, randomized by server spawnSeed.
-Real-time platforming: run, wall-slide, jump.
-Elimination occurs on death hazard contact or gunshots.
-Round ends when surviving player(s) touch finishArea or timeout triggers.
│
▼
[SCOREBOARD State]
Delay for waitTime (2s), then display for displayTime (3s).
-Server tallies points (victories, checkpoints, gun kills).
-Displays "Too Easy!" if zero players died (no points awarded).
-If a player reaches pointsToWin, match ends. Otherwise, loop to CHOOSING.
```

---

## 3. Gameplay Mechanics & Systems

### 3.1 Placeable Objects Catalog
- **1x1 Ice Block:** Weight 0 (hidden from crate); zero-collision interactable area that removes friction on enter and restores it on exit.
- **Ice Spray:** Interactive item with 3 uses; sprays and places 1x1 ice blocks dynamically.
- **Dog House:** Spawns an autonomous dog that chases the local player (calculated client-side to prevent network sync lag).
- **Sofa:** L-shaped piece; interaction area expands its sprite horizontally while dynamically decreasing its hitbox size due to a smooth surface.
- **Checkpoint Block:** Players must pass all checkpoints on the map before the finishArea unlocks.

### 3.2 Dynamic Underdog Mechanic
- A player trailing significantly behind the point leader receives an exclusive weapon (Underdog Gun).
- Grants a specialized crosshair cursor and 3 bullets.
- Firing plays a shooting animation, casts a line-of-sight ray, and instantly eliminates an opponent on hit.

### 3.3 Scoring & Point Attribution
- Points only count if the round is not "Too Easy" (at least one player must die).
- Point weights:
  - Surviving / Reaching Finish: 1 Victory point.
  - Checkpoint Clear: Configurable weight.
  - Underdog Gun Kill: Configurable weight.

### 3.4 Camera Panning & Interactions
- **Camera Panning:** Holding `Alt` toggles the camera to track the cursor instead of the player for map scouting.
- **Chat Bubbles:** Chat messages appear in goofy, pixelated speech bubbles above the characters rather than a static text box.
- **Map Globe Voter:** A large desk globe interactable where selecting a map dynamically rotates the globe and plots an animated red blinking beacon.