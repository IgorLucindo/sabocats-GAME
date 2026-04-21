import { gameServices } from '../core/GameServices.js';
import { deltaTime } from '../core/timing.js';

// SpectatorSystem - Camera spectating for dead/finished players
// Modes:
//   'player' - follow an alive remote player character (used in playing state)
//   'cursor' - follow an unplaced remote player cursor (used in placing state)

export class SpectatorSystem {
  constructor() {
    this._active        = false;
    this._mode          = null;
    this._spectatingId  = null;
    this._spectateTimer = null;
    this._hintShown     = false;
  }

  initialize() {}
  shutdown()   {}

  // Activate spectate for the given mode. Idempotent — safe to call every frame.
  start(mode) {
    if (this._active && this._mode === mode) { return; }
    gameServices.menuSystem.hideHint();
    this._active        = true;
    this._mode          = mode;
    this._spectatingId  = null;
    this._spectateTimer = null;
    this._hintShown     = false;
  }

  // Deactivate spectate — clears camera follow target and hint.
  stop() {
    this._active        = false;
    this._mode          = null;
    this._spectatingId  = null;
    this._spectateTimer = null;
    this._hintShown     = false;
    gameServices.cameraSystem.clearFollowTarget();
    gameServices.menuSystem.hideHint();
  }

  update() {
    if (!this._active) { return; }

    // Initial delay before starting to spectate
    if (this._spectateTimer === null) {
      const cfg = gameServices.gameConfig;
      this._spectateTimer = this._mode === 'player' ? cfg.states.playing.spectateDelay : 0;
    }
    if (this._spectateTimer > 0) { this._spectateTimer -= deltaTime; return; }

    if (this._mode === 'player') { this._updatePlayerSpectate(); }
    else if (this._mode === 'cursor') { this._updateCursorSpectate(); }
  }

  // ===== Input =====

  _handleInput() {
    const keys = gameServices.inputSystem.keys;
    if (keys.q.pressed && !keys.q.previousPressed) { this._cycleSpectate(-1); }
    if (keys.e.pressed && !keys.e.previousPressed) { this._cycleSpectate(1); }
  }

  _getCandidates() {
    const users = gameServices.users;
    const user  = gameServices.user;
    const ids   = [];

    if (this._mode === 'player') {
      for (const id in users) {
        if (id === user.id) { continue; }
        const rp = users[id].remotePlayer;
        if (rp?.loaded && !rp.dead && !rp.finished) { ids.push(id); }
      }
    } else if (this._mode === 'cursor') {
      for (const id in users) {
        if (id === user.id) { continue; }
        const u = users[id];
        if (u.placeableObject?.chose && !u.placeableObject?.placed) { ids.push(id); }
      }
    }

    return ids;
  }

  _cycleSpectate(direction) {
    const ids = this._getCandidates();
    if (ids.length <= 1) { return; }
    const idx = ids.indexOf(this._spectatingId);
    this._spectatingId = ids[(idx + direction + ids.length) % ids.length];
  }

  // ===== Player spectate (playing state) =====

  _updatePlayerSpectate() {
    const users  = gameServices.users;
    const user   = gameServices.user;
    const camera = gameServices.cameraSystem;
    const cfg    = gameServices.gameConfig;

    this._handleInput();

    // Drop current target if no longer alive
    if (this._spectatingId) {
      const rp = users[this._spectatingId]?.remotePlayer;
      if (!rp?.loaded || rp.dead || rp.finished) { this._spectatingId = null; }
    }

    // Auto-find next alive remote player
    if (!this._spectatingId) {
      for (const id in users) {
        if (id === user.id) { continue; }
        const rp = users[id].remotePlayer;
        if (rp?.loaded && !rp.dead && !rp.finished) { this._spectatingId = id; break; }
      }
    }

    if (this._spectatingId) {
      if (!this._hintShown) {
        gameServices.menuSystem.showHint('PRESS [q]/[e] TO SWITCH PLAYER');
        this._hintShown = true;
      }

      const rp  = users[this._spectatingId].remotePlayer;
      const s   = cfg.rendering.pixelScale;
      const cbW = cfg.player.camerabox.width  * s;
      const cbH = cfg.player.camerabox.height * s;
      camera.setFollowTarget({
        position: { x: rp.position.x + rp.width  / 2 - cbW / 2,
                    y: rp.position.y + rp.height / 2 - cbH / 2 },
        width: cbW,
        height: cbH
      });
    } else {
      camera.clearFollowTarget();
      gameServices.menuSystem.hideHint();
      this._hintShown = false;
    }
  }

  // ===== Cursor spectate (placing state) =====

  _updateCursorSpectate() {
    const users  = gameServices.users;
    const user   = gameServices.user;
    const camera = gameServices.cameraSystem;
    const cfg    = gameServices.gameConfig;

    this._handleInput();

    // Drop current target if they placed or disconnected
    if (this._spectatingId) {
      const u = users[this._spectatingId];
      if (!u || !u.placeableObject?.chose || u.placeableObject?.placed) { this._spectatingId = null; }
    }

    // Auto-find next unplaced remote player
    if (!this._spectatingId) {
      for (const id in users) {
        if (id === user.id) { continue; }
        const u = users[id];
        if (u.placeableObject?.chose && !u.placeableObject?.placed) { this._spectatingId = id; break; }
      }
    }

    if (this._spectatingId) {
      if (!this._hintShown) {
        gameServices.menuSystem.showHint('PRESS [q]/[e] TO SWITCH PLAYER');
        this._hintShown = true;
      }

      const cursor = users[this._spectatingId].cursor;
      const cbW    = cfg.mouse.cameraboxWidth;
      const cbH    = cfg.mouse.cameraboxHeight;
      camera.setFollowTarget({
        position: { x: cursor.position.x - cbW / 2, y: cursor.position.y - cbH / 2 },
        width: cbW,
        height: cbH
      });
    } else {
      camera.clearFollowTarget();
      gameServices.menuSystem.hideHint();
      this._hintShown = false;
    }
  }
}
