// CameraSystem - Centralized camera control and management system

class CameraSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;

    // Camera state
    this.position = { x: 0, y: 0 };
    this.destPosition = { x: 0, y: 0 };
    this.zoom = 1;
    this.destZoom = 1;
    this.maxZoom = GameConfig.camera.maxZoom;
    this.minZoom = GameConfig.camera.minZoom;
    this.move = { x: false, y: false };

    // Camera mode
    this.mode = 'free'; // 'free', 'follow', 'fixed'
    this.target = null;
    this.lerpSpeed = 0.1;
  }

  // System interface: Initialize
  initialize() {
    // Camera initialized in constructor
  }

  // System interface: Update camera position and zoom
  update() {
    this.updatePosition();
    this.updateZoom();
  }

  // System interface: Shutdown
  shutdown() {
    this.target = null;
  }

  // System interface: Query camera state
  query(question) {
    switch (question) {
      case 'cameraMode':
        return this.mode;
      case 'zoomLevel':
        return this.zoom;
      case 'position':
        return { ...this.position };
      default:
        return null;
    }
  }

  // ============ Core Camera Logic ============

  // Update position with lerp
  updatePosition() {
    this.position.x = -lerp(-this.position.x, this.destPosition.x, GameConfig.camera.positionLerpSpeed);
    this.position.y = -lerp(-this.position.y, this.destPosition.y, GameConfig.camera.positionLerpSpeed);
  }

  // Update zoom with lerp
  updateZoom() {
    this.zoom = lerp(this.zoom, this.destZoom, GameConfig.camera.zoomLerpSpeed);
    scaledCanvas.width = canvas.width / this.zoom;
    scaledCanvas.height = canvas.height / this.zoom;
  }

  // Set camera position with optional lerp
  setPosition({ position = { x: 0, y: 0 }, key = undefined }) {
    this.moveCamera({ position: position, key: key });
    this.position.x = -this.destPosition.x;
    this.position.y = -this.destPosition.y;
  }

  // Move camera to position
  moveCamera({ position = { x: 0, y: 0 }, key = undefined }) {
    let newPosition = position;
    switch (key) {
      case "middle":
        newPosition.x = (background.width - scaledCanvas.width) / 2;
        newPosition.y = (background.height - scaledCanvas.height) / 2;
        break;
      case "start":
        newPosition.x = 0;
        newPosition.y = background.height - scaledCanvas.height;
        break;
    }
    this.destPosition.x = newPosition.x;
    this.destPosition.y = newPosition.y;
  }

  // Set zoom
  setZoom(zoom) {
    this.destZoom = zoom;
  }

  // Pan camera based on object position
  panCamera({ object }) {
    this.move.x = false;
    this.move.y = false;

    this.panCameraLeft({ object: object });
    if (!this.move.x) { this.panCameraRight({ object: object }); }
    this.panCameraTop({ object: object });
    if (!this.move.y) { this.panCameraBottom({ object: object }); }
  }

  panCameraLeft({ object }) {
    const cameraboxRightSide = object.position.x + object.width;
    if (cameraboxRightSide >= scaledCanvas.width - this.position.x) {
      this.move.x = true;
      const newPositionX = Math.min(cameraboxRightSide - scaledCanvas.width, background.width - scaledCanvas.width);
      this.destPosition.x = newPositionX;
    }
  }

  panCameraRight({ object }) {
    const cameraboxLeftSide = object.position.x;
    if (cameraboxLeftSide <= -this.position.x) {
      this.move.x = true;
      const newPositionX = Math.max(cameraboxLeftSide, 0);
      this.destPosition.x = newPositionX;
    }
  }

  panCameraTop({ object }) {
    const cameraboxBottomSide = object.position.y + object.height;
    if (cameraboxBottomSide >= scaledCanvas.height - this.position.y) {
      this.move.y = true;
      const newPositionY = Math.min(cameraboxBottomSide - scaledCanvas.height, background.height - scaledCanvas.height);
      this.destPosition.y = newPositionY;
    }
  }

  panCameraBottom({ object }) {
    const cameraboxTopSide = object.position.y;
    if (cameraboxTopSide <= -this.position.y) {
      this.move.y = true;
      const newPositionY = Math.max(cameraboxTopSide, 0);
      this.destPosition.y = newPositionY;
    }
  }

  // ============ Camera Mode Management ============

  // Set camera to follow a target
  follow(target, lerpSpeed = 0.1) {
    this.mode = 'follow';
    this.target = target;
    this.lerpSpeed = lerpSpeed;
  }

  // Set camera to fixed position
  setFixed(position) {
    this.mode = 'fixed';
    this.target = null;
    this.position.x = position.x;
    this.position.y = position.y;
  }

  // Set camera to free pan mode
  setFreeMode() {
    this.mode = 'free';
    this.target = null;
  }

  // ============ Public Query Methods ============

  getZoom() {
    return this.zoom;
  }

  getPosition() {
    return { ...this.position };
  }

  getViewBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: scaledCanvas.width / this.zoom,
      height: scaledCanvas.height / this.zoom
    };
  }

  isInView(object) {
    const bounds = this.getViewBounds();
    return !(
      object.position.x + object.width < bounds.x ||
      object.position.x > bounds.x + bounds.width ||
      object.position.y + object.height < bounds.y ||
      object.position.y > bounds.y + bounds.height
    );
  }
}
