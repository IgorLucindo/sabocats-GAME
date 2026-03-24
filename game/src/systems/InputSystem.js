// InputSystem - Centralized keyboard and mouse input handling

export class InputSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.keys = {
      w:     { pressed: false },
      a:     { pressed: false, previousPressed: false },
      d:     { pressed: false, previousPressed: false },
      e:     { pressed: false, previousPressed: false },
      r:     { pressed: false },
      space: { pressed: false, previousPressed: false },
      shift: { pressed: false }
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
    let key = event.key.toLowerCase();
    if (key === " ") { key = "space"; }
    if (!this.keys[key]) { return; }
    this.keys[key].pressed = true;
    this.eventBus.emit('input:keyDown', { key, originalEvent: event });
  }

  handleKeyUp(event) {
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
    this.keys.e.previousPressed     = this.keys.e.pressed;
    this.keys.d.previousPressed     = this.keys.d.pressed;
    this.keys.a.previousPressed     = this.keys.a.pressed;
    this.keys.space.previousPressed = this.keys.space.pressed;
  }

  shutdown() {
    this.removeMouseListeners();
  }
}
