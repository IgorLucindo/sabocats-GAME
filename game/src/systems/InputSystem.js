// InputSystem - Centralized keyboard and mouse input handling

import { eventBus } from '../core/EventBus.js';

export class InputSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;

    // Keyboard state
    this.keys = {
      w: { pressed: false },
      a: { pressed: false },
      d: { pressed: false },
      e: { pressed: false, previousPressed: false },
      r: { pressed: false },
      space: { pressed: false, previousPressed: false },
      shift: { pressed: false }
    };
  }

  // Initialize all event listeners
  initialize() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
  }

  // Setup keyboard listeners
  setupKeyboardListeners() {
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.handleKeyUp(event));
  }

  // Remove keyboard listeners
  removeKeyboardListeners() {
    // Note: Can't easily remove anonymous listeners, so we track them internally
    // For now, we focus on mouse listeners which are more critical for game states
  }

  // Setup mouse listeners
  setupMouseListeners() {
    this.mouseMoveBound = (e) => this.handleMouseMove(e);
    this.mouseDownBound = (e) => this.handleMouseDown(e);
    this.mouseUpBound = (e) => this.handleMouseUp(e);

    window.addEventListener("mousemove", this.mouseMoveBound);
    window.addEventListener("mousedown", this.mouseDownBound);
    window.addEventListener("mouseup", this.mouseUpBound);
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // Remove mouse listeners (used when entering gameplay)
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

  // Reset mouse listeners (used when returning to menu/choosing)
  resetMouseListeners() {
    this.removeMouseListeners();
    this.setupMouseListeners();
  }

  // Handle key down
  handleKeyDown(event) {
    let key = event.key.toLowerCase();
    if (key === " ") { key = "space"; }

    // Skip if key is not tracked
    if (!this.keys[key]) { return; }

    this.keys[key].pressed = true;
    this.eventBus.emit('input:keyDown', { key, originalEvent: event });
  }

  // Handle key up
  handleKeyUp(event) {
    let key = event.key.toLowerCase();
    if (key === " ") { key = "space"; }

    // Skip if key is not tracked
    if (!this.keys[key]) { return; }

    this.keys[key].pressed = false;
    this.eventBus.emit('input:keyUp', { key, originalEvent: event });
  }

  // Handle mouse move
  handleMouseMove(event) {
    this.eventBus.emit('input:mouseMove', {
      x: event.x,
      y: event.y,
      originalEvent: event
    });
  }

  // Handle mouse down
  handleMouseDown(event) {
    if (event.button === 0) {
      this.eventBus.emit('input:mouseDown', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.eventBus.emit('input:mouseDown', { button: 2, originalEvent: event });
    }
  }

  // Handle mouse up
  handleMouseUp(event) {
    if (event.button === 0) {
      this.eventBus.emit('input:mouseUp', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.eventBus.emit('input:mouseUp', { button: 2, originalEvent: event });
    }
  }

  // Check if a key is pressed
  isKeyPressed(key) {
    return this.keys[key] ? this.keys[key].pressed : false;
  }

  // Check if a key was just pressed (transition from unpressed to pressed)
  wasKeyPressed(key) {
    return this.keys[key] ? (this.keys[key].pressed && !this.keys[key].previousPressed) : false;
  }

  // Update previous state for next frame
  updatePreviousState() {
    this.keys.e.previousPressed = this.keys.e.pressed;
    this.keys.d.previousPressed = this.keys.d.pressed;
    this.keys.a.previousPressed = this.keys.a.pressed;
    this.keys.space.previousPressed = this.keys.space.pressed;
  }

  // Cleanup listeners
  cleanup() {
    this.removeKeyboardListeners();
    this.removeMouseListeners();
  }

  // System interface: shutdown cleanup
  shutdown() {
    this.cleanup();
  }

  // System interface: query interface for other systems
  query(question) {
    switch (question) {
      case 'isMovingRight':
        return this.isKeyPressed('d') && !this.isKeyPressed('a');
      case 'isMovingLeft':
        return this.isKeyPressed('a') && !this.isKeyPressed('d');
      case 'isSprinting':
        return this.isKeyPressed('shift');
      case 'isJumping':
        return this.isKeyPressed('space');
      case 'isWallSliding':
        return this.isKeyPressed('w');
      case 'isInteracting':
        return this.isKeyPressed('e');
      default:
        return null;
    }
  }
}
