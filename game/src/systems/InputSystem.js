// InputSystem - Centralized keyboard and mouse input handling

import { deltaTime } from '../core/timing.js';

export class InputSystem {
  constructor(eventBus, canvas) {
    this.eventBus = eventBus;
    this.canvas   = canvas;
    this.disabled = false;

    // Actions mapped from input sources (keyboard, gamepad, touch)
    this.actions = {
      moveLeft:       { pressed: false, previousPressed: false, holdTime: 0 },
      moveRight:      { pressed: false, previousPressed: false, holdTime: 0 },
      jump:           { pressed: false, previousPressed: false, holdTime: 0 },
      run:         { pressed: false, previousPressed: false, holdTime: 0 },
      interact:       { pressed: false, previousPressed: false, holdTime: 0 },
      giveup:         { pressed: false, previousPressed: false, holdTime: 0 },
      lookDown:       { pressed: false, previousPressed: false, holdTime: 0 },
      lookUp:         { pressed: false, previousPressed: false, holdTime: 0 },
      spectateLeft:   { pressed: false, previousPressed: false, holdTime: 0 },
      spectateRight:  { pressed: false, previousPressed: false, holdTime: 0 },
      rotate:         { pressed: false, previousPressed: false, holdTime: 0 },
      close:          { pressed: false, previousPressed: false, holdTime: 0 },
      select:         { pressed: false, previousPressed: false, holdTime: 0 }
    };

    // Keyboard mapping to actions
    this.keyMap = {
      'a': 'moveLeft',
      'd': 'moveRight',
      ' ': 'jump',
      'shift': 'run',
      'e': ['interact', 'spectateRight'],
      'g': 'giveup',
      's': 'lookDown',
      'w': 'lookUp',
      'q': 'spectateLeft',
      'r': 'rotate'
    };
  }

  initialize() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.setupTouchListeners();
    this.preventGestures();
  }

  preventGestures() {
    // Prevent pinch-to-zoom and other gestures
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
  }

  setupKeyboardListeners() {
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  setupMouseListeners() {
    this.mouseMoveBound = (e) => this.handleMouseMove(e);
    this.mouseDownBound = (e) => this.handleMouseDown(e);
    this.mouseUpBound   = (e) => this.handleMouseUp(e);

    window.addEventListener("mousemove",    this.mouseMoveBound);
    window.addEventListener("mousedown",    this.mouseDownBound);
    window.addEventListener("mouseup",      this.mouseUpBound);
    window.addEventListener("contextmenu",  (e) => e.preventDefault());
  }

  removeMouseListeners() {
    if (this.mouseMoveBound) {
      window.removeEventListener("mousemove", this.mouseMoveBound);
    }
    if (this.mouseDownBound) {
      window.removeEventListener("mousedown", this.mouseDownBound);
    }
    if (this.mouseUpBound) {
      window.removeEventListener("mouseup", this.mouseUpBound);
    }
  }

  // Remove and re-add mouse listeners (used when returning to menu/choosing)
  resetMouseListeners() {
    this.removeMouseListeners();
    this.setupMouseListeners();
  }

  setupTouchListeners() {
    this._touchStartX   = 0;
    this._touchStartY   = 0;
    this._touchLastX    = 0;
    this._touchLastY    = 0;
    this._isDragging    = false;
    this._dragThreshold = 6;

    window.addEventListener("touchstart", (e) => {
      // Only handle canvas touches — let browser handle menu clicks naturally
      if (e.target !== this.canvas) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX, y = touch.clientY;
      this._touchStartX = x;
      this._touchStartY = y;
      this._touchLastX  = x;
      this._touchLastY  = y;
      this._isDragging  = false;
      this.eventBus.emit('input:mouseMove', { x, y });
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (e.target !== this.canvas) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX, y = touch.clientY;
      const dx = x - this._touchLastX;
      const dy = y - this._touchLastY;
      if (Math.hypot(x - this._touchStartX, y - this._touchStartY) > this._dragThreshold) {
        this._isDragging = true;
      }
      if (this._isDragging) {
        this.eventBus.emit('input:touchDrag', { dx, dy });
      }
      // Always update cursor position during touch so CharacterOption mouseOver works
      this.eventBus.emit('input:mouseMove', { x, y });
      this._touchLastX = x;
      this._touchLastY = y;
    }, { passive: false });

    window.addEventListener("touchend", (e) => {
      if (e.target !== this.canvas) return;
      e.preventDefault();
      if (!this._isDragging) {
        const touch = e.changedTouches[0];
        if (touch) {
          this.eventBus.emit('input:touchTap', { x: touch.clientX, y: touch.clientY });
        }
      }
      this._isDragging = false;
    }, { passive: false });
  }

  handleKeyDown(event) {
    if (this.disabled) return;
    let key = event.key.toLowerCase();

    const action = this.keyMap[key];
    if (!action) { return; }

    // Handle array of actions (multi-mapping)
    const actions = Array.isArray(action) ? action : [action];
    for (const act of actions) {
      this.actions[act].pressed = true;
    }

    this.eventBus.emit('input:keyDown', { key, originalEvent: event });
  }

  handleKeyUp(event) {
    if (this.disabled) return;
    let key = event.key.toLowerCase();

    const action = this.keyMap[key];
    if (!action) { return; }

    // Handle array of actions (multi-mapping)
    const actions = Array.isArray(action) ? action : [action];
    for (const act of actions) {
      this.actions[act].pressed = false;
    }

    this.eventBus.emit('input:keyUp', { key, originalEvent: event });
  }

  handleMouseMove(event) {
    this.eventBus.emit('input:mouseMove', {
      x: event.x,
      y: event.y,
      originalEvent: event
    });
  }

  handleMouseDown(event) {
    if (event.button === 0) {
      this.eventBus.emit('input:mouseDown', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.eventBus.emit('input:mouseDown', { button: 2, originalEvent: event });
    }
  }

  handleMouseUp(event) {
    if (event.button === 0) {
      this.eventBus.emit('input:mouseUp', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.eventBus.emit('input:mouseUp', { button: 2, originalEvent: event });
    }
  }

  updatePreviousState() {
    // Update previous state and hold time for all actions
    for (let action in this.actions) {
      this.actions[action].previousPressed = this.actions[action].pressed;
      this.actions[action].holdTime = this.actions[action].pressed
        ? this.actions[action].holdTime + deltaTime
        : 0;
    }
  }

  shutdown() {
    this.removeMouseListeners();
  }
}
