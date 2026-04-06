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

  // Clamp camera position; centers map when it's smaller than the viewport
  _clampX(x) {
    const range = gameServices.background.width - scaledCanvas.width;
    if (range <= 0) { return range / 2; }
    return Math.max(0, Math.min(range, x));
  }

  _clampY(y) {
    const range = gameServices.background.height - scaledCanvas.height;
    if (range <= 0) { return range / 2; }
    return Math.max(0, Math.min(range, y));
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

  _resolvePosition({ key, position = { x: 0, y: 0 } }) {
    const bg = gameServices.background;
    const w = canvas.width / this.destZoom;
    const h = canvas.height / this.destZoom;
    const rangeX = bg.width - w;
    const rangeY = bg.height - h;
    const clampX = (x) => rangeX <= 0 ? rangeX / 2 : Math.max(0, Math.min(rangeX, x));
    const clampY = (y) => rangeY <= 0 ? rangeY / 2 : Math.max(0, Math.min(rangeY, y));
    if (key === "middle") return { x: clampX((bg.width - w) / 2), y: clampY((bg.height - h) / 2) };
    if (key === "spawnArea") {
      const sa = gameServices.spawnArea;
      if (sa) return { x: clampX(sa.position.x + sa.width / 2 - w / 2), y: clampY(sa.position.y + sa.height / 2 - h / 2) };
    }
    if (key === "finishArea") {
      const fa = gameServices.finishArea;
      if (fa) return { x: clampX(fa.position.x + fa.width / 2 - w / 2), y: clampY(fa.position.y + fa.height / 2 - h / 2) };
    }
    return { x: position.x, y: position.y };
  }

  // Set camera position instantly (no lerp)
  setPosition({ position = { x: 0, y: 0 }, key = undefined }) {
    const target = this._resolvePosition({ key, position });
    this.destPosition.x = target.x;
    this.destPosition.y = target.y;
    this.position.x = -target.x;
    this.position.y = -target.y;
  }

  // Lerp camera to position
  moveTo({ position = { x: 0, y: 0 }, key = undefined }) {
    const target = this._resolvePosition({ key, position });
    this.destPosition.x = target.x;
    this.destPosition.y = target.y;
  }

  setZoom(zoom) {
    this.destZoom = zoom;
  }

  // Instant zoom — also updates scaledCanvas immediately so position resolution is correct
  snapZoom(zoom) {
    this.zoom = zoom;
    this.destZoom = zoom;
    scaledCanvas.width = canvas.width / zoom;
    scaledCanvas.height = canvas.height / zoom;
  }

  // Smallest zoom that fits the entire background into the canvas
  getOverviewZoom() {
    const bg = gameServices.background;
    return Math.min(canvas.width / bg.width, canvas.height / bg.height);
  }
}
