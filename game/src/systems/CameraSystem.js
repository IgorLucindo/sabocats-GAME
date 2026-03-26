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

  // Clamp a value to [0, background dimension - canvas dimension]
  _clampX(x) {
    return Math.max(0, Math.min(gameServices.background.width - scaledCanvas.width, x));
  }

  _clampY(y) {
    return Math.max(0, Math.min(gameServices.background.height - scaledCanvas.height, y));
  }

  // Incrementally shift camera destination by dx/dy (clamped to background bounds)
  pan({ dx = 0, dy = 0 }) {
    if (dx !== 0) { this.destPosition.x = this._clampX(this.destPosition.x + dx); }
    if (dy !== 0) { this.destPosition.y = this._clampY(this.destPosition.y + dy); }
  }

  // Track an object's camerabox, snapping destination to keep it in view
  panCamera({ object }) {
    const rb = object.position.x + object.width;
    const lb = object.position.x;
    const bb = object.position.y + object.height;
    const tb = object.position.y;

    if (rb >= scaledCanvas.width - this.position.x) {
      this.destPosition.x = this._clampX(rb - scaledCanvas.width);
    } else if (lb <= -this.position.x) {
      this.destPosition.x = this._clampX(lb);
    }
    if (bb >= scaledCanvas.height - this.position.y) {
      this.destPosition.y = this._clampY(bb - scaledCanvas.height);
    } else if (tb <= -this.position.y) {
      this.destPosition.y = this._clampY(tb);
    }
  }

  // Set camera position instantly (no lerp), with optional named key
  setPosition({ position = { x: 0, y: 0 }, key = undefined }) {
    const background = gameServices.background;
    if (key === "middle") {
      this.destPosition.x = (background.width - scaledCanvas.width) / 2;
      this.destPosition.y = (background.height - scaledCanvas.height) / 2;
    } else if (key === "start") {
      this.destPosition.x = 0;
      this.destPosition.y = background.height - scaledCanvas.height;
    } else {
      this.destPosition.x = position.x;
      this.destPosition.y = position.y;
    }
    this.position.x = -this.destPosition.x;
    this.position.y = -this.destPosition.y;
  }

  setZoom(zoom) {
    this.destZoom = zoom;
  }
}
