// GamepadSystem — virtual on-screen gamepad (DOM overlay)

import { gameState } from '../core/GameState.js';
import { gameServices } from '../core/GameServices.js';

const BUTTON_DEFS = [
  { id: 'btn-rotate', actions: ['rotate'],             normal: 'assets/textures/keys/gamepad/rotate.png', pressed: 'assets/textures/keys/gamepad/pressed/rotate.png' },
  { id: 'btn-select', actions: ['interact', 'select'], normal: 'assets/textures/keys/gamepad/select.png', pressed: 'assets/textures/keys/gamepad/pressed/select.png' },
  { id: 'btn-jump',   actions: ['jump'],               normal: 'assets/textures/keys/gamepad/jump.png',   pressed: 'assets/textures/keys/gamepad/pressed/jump.png' },
  { id: 'btn-close',  actions: ['close'],              normal: 'assets/textures/keys/gamepad/close.png',  pressed: 'assets/textures/keys/gamepad/pressed/close.png' },
];

export class GamepadSystem {
  constructor(inputSystem, canvas) {
    this.inputSystem = inputSystem;
    this.canvas = canvas;

    this._overlay        = null;
    this._joystickBase   = null;
    this._joystickStick  = null;
    this._buttons        = {}; // action -> { el, normalSrc, pressedSrc }

    this._joystickTouchId = null;
    this._joystickCenterX = 0;
    this._joystickCenterY = 0;
    this._joystickRadius  = 0;
    this._joystickNX      = 0;
    this._joystickNY      = 0;
    this._runThreshold    = 0;
    this._deadzone        = 0;
    this._buttonTouches   = new Map(); // touchId -> action

    this._moveBound = (e) => this._onTouchMove(e);
    this._endBound  = (e) => this._onTouchEnd(e);

    // Legacy compat — kept so callers that check these don't crash
    this.enabled = false;
    this.visible = false;
  }

  initialize() {
    this._overlay       = document.getElementById('gamepad-overlay');
    this._joystickBase  = document.getElementById('gamepad-joystick-base');
    this._joystickStick = document.getElementById('gamepad-joystick-stick');

    // Apply config-driven layout via CSS custom properties
    const cfg = gameServices.gameConfig.gamepad;
    this._joystickRadius = cfg.joystick.radius;
    this._runThreshold   = cfg.runThreshold;
    this._deadzone       = cfg.deadzone;
    const ov = this._overlay;
    ov.style.setProperty('--gp-joystick-size',     cfg.joystick.size    + 'px');
    ov.style.setProperty('--gp-joystick-offset-x', cfg.joystick.offsetX + 'px');
    ov.style.setProperty('--gp-joystick-offset-y', cfg.joystick.offsetY + 'px');
    ov.style.setProperty('--gp-btn-size',          cfg.buttons.size     + 'px');
    ov.style.setProperty('--gp-btn-offset-x',      cfg.buttons.offsetX  + 'px');
    ov.style.setProperty('--gp-btn-offset-y',      cfg.buttons.offsetY  + 'px');

    // Joystick touchstart — recalculate center each press so layout changes don't matter
    this._joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this._joystickTouchId !== null) return;
      const t = e.changedTouches[0];
      const rect = this._joystickBase.getBoundingClientRect();
      this._joystickCenterX = rect.left + rect.width  / 2;
      this._joystickCenterY = rect.top  + rect.height / 2;
      this._joystickTouchId = t.identifier;
      this._updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    // Prevent double-tap zoom on the buttons area (CSS touch-action alone isn't enough in some browsers)
    document.getElementById('gamepad-buttons-area')
      ?.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    // Button touchstarts
    for (const def of BUTTON_DEFS) {
      const el = document.getElementById(def.id);
      if (!el) continue;
      this._buttons[def.id] = { el, actions: def.actions, normalSrc: def.normal, pressedSrc: def.pressed };

      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        for (const t of e.changedTouches) {
          if (![...this._buttonTouches.values()].includes(def.id)) {
            this._buttonTouches.set(t.identifier, def.id);
            this._setButtonPressed(def.id, true);
          }
        }
      }, { passive: false });
    }

    this.toggleBtn('btn-select', false);
    this.toggleBtn('btn-rotate', false);
    this.toggleBtn('btn-jump',   false);
    this.toggleBtn('btn-close',  false);

    // Global move/end handles joystick drag and buttons released outside element
    window.addEventListener('touchmove',   this._moveBound, { passive: false });
    window.addEventListener('touchend',    this._endBound,  { passive: false });
    window.addEventListener('touchcancel', this._endBound,  { passive: false });
  }

  _onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystickTouchId) {
        e.preventDefault();
        this._updateJoystick(t.clientX, t.clientY);
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystickTouchId) {
        this._joystickTouchId = null;
        this._joystickNX = 0;
        this._joystickNY = 0;
        if (this._joystickStick) {
          this._joystickStick.style.transform = 'translate(-50%, -50%)';
        }
        this._setAction('moveLeft',  false);
        this._setAction('moveRight', false);
        this._setAction('run',       false);
        this._setAction('lookDown',  false);
        this._setAction('lookUp',    false);
      }

      const btnId = this._buttonTouches.get(t.identifier);
      if (btnId) {
        this._buttonTouches.delete(t.identifier);
        this._setButtonPressed(btnId, false);
      }
    }
  }

  _updateJoystick(touchX, touchY) {
    const dx   = touchX - this._joystickCenterX;
    const dy   = touchY - this._joystickCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max  = this._joystickRadius;
    const cx   = dist > max ? (dx / dist) * max : dx;
    const cy   = dist > max ? (dy / dist) * max : dy;

    this._joystickStick.style.transform =
      `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;

    const normalizedX = cx / max;
    const normalizedY = cy / max;
    this._joystickNX = normalizedX;
    this._joystickNY = normalizedY;

    const state = gameServices.matchStateMachine?.getState();
    if (state !== 'placing') {
      this._setAction('moveLeft',  normalizedX < -this._deadzone);
      this._setAction('moveRight', normalizedX >  this._deadzone);
      this._setAction('lookDown',  normalizedY >  this._deadzone);
      this._setAction('lookUp',    normalizedY < -this._deadzone);
      this._setAction('run', Math.abs(normalizedX) >= this._runThreshold);
    }
  }

  _setButtonPressed(btnId, pressed) {
    const btn = this._buttons[btnId];
    if (!btn) return;
    for (const action of btn.actions) this._setAction(action, pressed);
    const img = btn.el.querySelector('img');
    if (img) img.src = pressed ? btn.pressedSrc : btn.normalSrc;
  }

  _setAction(action, pressed) {
    const a = this.inputSystem.actions[action];
    if (a) a.pressed = pressed;
  }

  enable() {
    if (!gameState.get('environment.isTouch')) return;
    this.enabled = true;
    this.visible = true;
    this._overlay.classList.add('visible');
  }

  disable() {
    if (!gameState.get('environment.isTouch')) return;
    this.enabled = false;
    this.visible = false;
    this._overlay.classList.remove('visible');

    // Reset all input state
    this._joystickTouchId = null;
    this._joystickNX = 0;
    this._joystickNY = 0;
    if (this._joystickStick) {
      this._joystickStick.style.transform = 'translate(-50%, -50%)';
    }
    this._setAction('moveLeft',  false);
    this._setAction('moveRight', false);
    this._setAction('run',       false);
    this._setAction('lookDown',  false);
    this._setAction('lookUp',    false);

    this._buttonTouches.forEach((btnId) => this._setButtonPressed(btnId, false));
    this._buttonTouches.clear();
    this.toggleBtn('btn-select', false);
    this.toggleBtn('btn-rotate', false);
    this.toggleBtn('btn-jump',   false);
    this.toggleBtn('btn-close',  false);
  }

  render() {}
  onResize() {}

  update() {
    if (!gameState.get('environment.isTouch')) return;

    const state  = gameServices.matchStateMachine?.getState();
    const player = gameServices.player;
    const placed = gameServices.user?.placeableObject?.placed;

    const inLobby   = state === 'lobby'   && player?.loaded;
    const inPlacing = state === 'placing' && !placed;
    const inPlaying = state === 'playing' && !player?.dead && !player?.finished;
    const shouldBeActive = inLobby || inPlacing || inPlaying;

    if (shouldBeActive && !this.enabled)       this.enable();
    else if (!shouldBeActive && this.enabled)  this.disable();

    if (!this.enabled) return;

    this._syncButtons(inLobby, inPlacing, inPlaying);

    if (inPlacing && (this._joystickNX !== 0 || this._joystickNY !== 0)) {
      const speed = gameServices.gameConfig.gamepad.placingSpeed;
      gameServices.cursorSystem.moveScreenBy(this._joystickNX * speed, this._joystickNY * speed);
    }
  }

  _syncButtons(inLobby, inPlacing, inPlaying) {
    const nearInteractable = (gameServices.interactionSystem?.areas || []).some((a) => a?.onPress && a.highlighted);
    this.toggleBtn('btn-rotate', inPlacing);
    this.toggleBtn('btn-select', inPlacing || nearInteractable);
    this.toggleBtn('btn-jump',   inLobby || inPlaying);
    this.toggleBtn('btn-close',  inLobby);
  }

  shutdown() {
    window.removeEventListener('touchmove',   this._moveBound);
    window.removeEventListener('touchend',    this._endBound);
    window.removeEventListener('touchcancel', this._endBound);
  }

  toggleBtn(btnId, visible) {
    const btn = this._buttons[btnId];
    if (!btn || btn.visible === visible) return;
    btn.visible = visible;

    btn.el.classList.toggle('gamepad-hidden', !visible);
    if (!visible) {
      for (const action of btn.actions) this._setAction(action, false);
      for (const [touchId, id] of this._buttonTouches.entries()) {
        if (id === btnId) this._buttonTouches.delete(touchId);
      }
    }
  }
}
