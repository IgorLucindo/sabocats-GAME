// InputSystem - Centralized keyboard and mouse input handling

class InputSystem {
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

    // Mouse state (will be replaced with Mouse class instance in index.js)
    this.mouse = {
      down: false,
      move: false,
      event: undefined,
      canvasPosition: { x: 0, y: 0 },
      gridPosition: { x: 0, y: 0 },
      previousGridPosition: { x: 0, y: 0 },
      mouse1: { pressed: false, previousPressed: false },
      mouse2: { pressed: false, previousPressed: false }
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

  // Setup mouse listeners
  setupMouseListeners() {
    window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    window.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    window.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // Handle mouse move
  handleMouseMove(event) {
    this.mouse.move = true;
    this.mouse.event = event;
    this.eventBus.emit('input:mouseMove', {
      x: event.x,
      y: event.y,
      originalEvent: event
    });
  }

  // Handle mouse down
  handleMouseDown(event) {
    this.mouse.down = true;
    this.mouse.event = event;

    if (event.button === 0) {
      this.mouse.mouse1.pressed = true;
      this.eventBus.emit('input:mouseDown', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.mouse.mouse2.pressed = true;
      this.eventBus.emit('input:mouseDown', { button: 2, originalEvent: event });
    }
  }

  // Handle mouse up
  handleMouseUp(event) {
    this.mouse.down = false;
    this.mouse.event = event;

    if (event.button === 0) {
      this.mouse.mouse1.pressed = false;
      this.eventBus.emit('input:mouseUp', { button: 1, originalEvent: event });
    } else if (event.button === 2) {
      this.mouse.mouse2.pressed = false;
      this.eventBus.emit('input:mouseUp', { button: 2, originalEvent: event });
    }
  }

  // Update mouse state based on camera and grid
  updateMouseState(camera, grid) {
    if (this.mouse.down) {
      // Handle mouse down events
      if (this.mouse.event.button === 0) {
        this.mouse.mouse1.pressed = true;
      }
      else if (this.mouse.event.button === 2) {
        this.mouse.mouse2.pressed = true;
        this.updateMouseCanvasPosition(camera, grid);
      }
    }
    else if (this.mouse.event) {
      if (this.mouse.event.button === 0) {
        this.mouse.mouse1.pressed = false;
      }
      else if (this.mouse.event.button === 2) {
        this.mouse.mouse2.pressed = false;
      }
    }

    // Handle mouse move events
    if (this.mouse.move || camera.move.x || camera.move.y) {
      this.updateMouseCanvasPosition(camera, grid);
    }

    this.mouse.move = false;
  }

  // Update mouse canvas and grid position
  updateMouseCanvasPosition(camera, grid) {
    if (!this.mouse.event) return;

    this.mouse.canvasPosition.x = this.mouse.event.x / camera.zoom - camera.position.x;
    this.mouse.canvasPosition.y = this.mouse.event.y / camera.zoom - camera.position.y;

    if (grid) {
      this.mouse.gridPosition.x = Math.floor(
        (this.mouse.canvasPosition.x - grid.position.x) / GameConfig.rendering.tileSize
      );
      this.mouse.gridPosition.y = Math.floor(
        (this.mouse.canvasPosition.y - grid.position.y) / GameConfig.rendering.tileSize
      );
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

  // Get current mouse position
  getMousePosition() {
    return { ...this.mouse.canvasPosition };
  }

  // Get current grid position
  getGridPosition() {
    return { ...this.mouse.gridPosition };
  }

  // Update previous state for next frame
  updatePreviousState() {
    this.mouse.previousGridPosition.x = this.mouse.gridPosition.x;
    this.mouse.previousGridPosition.y = this.mouse.gridPosition.y;
    this.mouse.mouse1.previousPressed = this.mouse.mouse1.pressed;
    this.keys.e.previousPressed = this.keys.e.pressed;
    this.keys.d.previousPressed = this.keys.d.pressed;
    this.keys.a.previousPressed = this.keys.a.pressed;
    this.keys.space.previousPressed = this.keys.space.pressed;
  }

  // Cleanup listeners
  cleanup() {
    window.removeEventListener("mousemove", (e) => this.handleMouseMove(e));
    window.removeEventListener("mousedown", (e) => this.handleMouseDown(e));
    window.removeEventListener("mouseup", (e) => this.handleMouseUp(e));
    window.removeEventListener("keydown", (e) => this.handleKeyDown(e));
    window.removeEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  // System interface: update is called per-frame with camera and grid
  update(camera, grid) {
    this.updateMouseState(camera, grid);
  }

  // System interface: shutdown cleanup
  shutdown() {
    this.cleanup();
  }

  // System interface: query interface for other systems
  query(question) {
    switch (question) {
      case 'mousePosition':
        return this.getMousePosition();
      case 'gridPosition':
        return this.getGridPosition();
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
      case 'mouseButton1Pressed':
        return this.mouse.mouse1.pressed;
      case 'mouseButton2Pressed':
        return this.mouse.mouse2.pressed;
      default:
        return null;
    }
  }
}

// Create singleton instance
const inputSystem = new InputSystem(eventBus);
