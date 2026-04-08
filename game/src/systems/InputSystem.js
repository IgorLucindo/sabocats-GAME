// InputSystem - Centralized keyboard and mouse input handling

import { deltaTime } from '../core/timing.js';

export class InputSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.disabled = false;

    this.keys = {
      w:     { pressed: false, previousPressed: false, holdTime: 0 },
      a:     { pressed: false, previousPressed: false, holdTime: 0 },
      d:     { pressed: false, previousPressed: false, holdTime: 0 },
      e:     { pressed: false, previousPressed: false, holdTime: 0 },
      g:     { pressed: false, previousPressed: false, holdTime: 0 },
      q:     { pressed: false, previousPressed: false, holdTime: 0 },
      r:     { pressed: false, previousPressed: false, holdTime: 0 },
      space: { pressed: false, previousPressed: false, holdTime: 0 },
      shift: { pressed: false, previousPressed: false, holdTime: 0 }
    };
  }

  initialize() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
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

  handleKeyDown(event) {
    if (this.disabled) return;
    let key = event.key.toLowerCase();
    if (key === " ") { key = "space"; }
    if (!this.keys[key]) { return; }
    this.keys[key].pressed = true;
    this.eventBus.emit('input:keyDown', { key, originalEvent: event });
  }

  handleKeyUp(event) {
    if (this.disabled) return;
    let key = event.key.toLowerCase();
    if (key === " ") { key = "space"; }
    if (!this.keys[key]) { return; }
    this.keys[key].pressed = false;
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
    for (let key in this.keys) {
      this.keys[key].previousPressed = this.keys[key].pressed;
      this.keys[key].holdTime = this.keys[key].pressed ? this.keys[key].holdTime + deltaTime : 0;
    }
  }

  shutdown() {
    this.removeMouseListeners();
  }
}
