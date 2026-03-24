import { canvas, scaledCanvas } from '../core/renderContext.js';
import { lerp } from '../helpers.js';
import { gameServices } from '../core/GameServices.js';

// CameraSystem - Centralized camera control and management system

export class CameraSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;

    this.position = { x: 0, y: 0 };
    this.destPosition = { x: 0, y: 0 };
    this.zoom = 1;
    this.destZoom = 1;
    this.maxZoom = gameConfig.camera.maxZoom;
    this.minZoom = gameConfig.camera.minZoom;
    this.move = { x: false, y: false };
  }

  initialize() {}

  update() {
    this.updatePosition();
    this.updateZoom();
  }

  shutdown() {}

  // Update position with lerp
  updatePosition() {
    this.position.x = -lerp(-this.position.x, this.destPosition.x, this.gameConfig.camera.positionLerpSpeed);
    this.position.y = -lerp(-this.position.y, this.destPosition.y, this.gameConfig.camera.positionLerpSpeed);
  }

  // Update zoom with lerp
  updateZoom() {
    this.zoom = lerp(this.zoom, this.destZoom, this.gameConfig.camera.zoomLerpSpeed);
    scaledCanvas.width = canvas.width / this.zoom;
    scaledCanvas.height = canvas.height / this.zoom;
  }

  // Set camera position instantly (no lerp)
  setPosition({ position = { x: 0, y: 0 }, key = undefined }) {
    this.moveCamera({ position: position, key: key });
    this.position.x = -this.destPosition.x;
    this.position.y = -this.destPosition.y;
  }

  // Move camera to position (with lerp)
  moveCamera({ position = { x: 0, y: 0 }, key = undefined }) {
    let newPosition = position;
    const background = gameServices.background;
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

  setZoom(zoom) {
    this.destZoom = zoom;
  }

  getZoom() {
    return this.zoom;
  }

  getPosition() {
    return { ...this.position };
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
    const background = gameServices.background;
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
    const background = gameServices.background;
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
}
