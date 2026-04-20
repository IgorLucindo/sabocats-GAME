import { canvas, scaledCanvas } from '../core/renderContext.js';
import { lerp } from '../helpers.js';
import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';

export class CameraSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;

    this.position = { x: 0, y: 0 };
    this.destPosition = { x: 0, y: 0 };
    this.zoom = 1;
    this.destZoom = 1;
    this.maxZoom = gameConfig.camera.maxZoom;
    this.minZoom = gameConfig.camera.minZoom;
    this._followTarget = null;
    this.shakeOffset = { x: 0, y: 0 };
    this._shakeTicks = 0;
    this._shakeStrength = 0;
    // Keeps a world point pinned to a screen pixel while zoom lerps.
    // Used by zoomToCursor — no teleport at start because cursor coords are derived from current camera state.
    this._anchor = null; // { worldX, worldY, screenX, screenY }
    // Drives zoom + position together via lerp at zoomLerpSpeed so they arrive simultaneously.
    // Used by zoomToKey / zoomToWorldCenter where positionLerpSpeed ≠ zoomLerpSpeed would cause two-motion feel.
    this._tween = null; // { endZoom, endPX, endPY }
  }

  initialize() {}

  update() {
    if (this._followTarget) { this.panCamera({ object: this._followTarget }); }
    if (this._tween) {
      this._updateTween();
    } else {
      this.updatePosition();
      this.updateZoom();
    }
    this._updateShake();
  }

  shutdown() {}

  shake(duration, amplitude) {
    if (!gameState.get('settings.screenShake')) return;
    this._shakeTicks = duration;
    this._shakeStrength = amplitude;
  }

  _updateShake() {
    if (this._shakeTicks > 0) {
      this.shakeOffset.x = (Math.random() * 2 - 1) * this._shakeStrength;
      this.shakeOffset.y = (Math.random() * 2 - 1) * this._shakeStrength;
      this._shakeTicks--;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }

  setFollowTarget(object) { this._followTarget = object; this._tween = null; }
  clearFollowTarget()     { this._followTarget = null; }

  // Lerp zoom and position together at zoomLerpSpeed — same exponential-decay feel as regular lerp,
  // but both axes converge simultaneously regardless of positionLerpSpeed.
  _updateTween() {
    const tw    = this._tween;
    const speed = this.gameConfig.camera.zoomLerpSpeed;
    this.zoom       = lerp(this.zoom,        tw.endZoom, speed);
    this.position.x = lerp(this.position.x, -tw.endPX,  speed);
    this.position.y = lerp(this.position.y, -tw.endPY,  speed);
    this.destZoom       = tw.endZoom;
    this.destPosition.x = tw.endPX;
    this.destPosition.y = tw.endPY;
    scaledCanvas.width  = canvas.width  / this.zoom;
    scaledCanvas.height = canvas.height / this.zoom;
    if (Math.abs(this.zoom - tw.endZoom) < 0.001) {
      this.zoom       = tw.endZoom;
      this.position.x = -tw.endPX;
      this.position.y = -tw.endPY;
      this._tween = null;
    }
  }

  // When anchor is active, position is derived directly from the lerping zoom so both
  // converge as one motion. Cleared automatically once zoom settles.
  updatePosition() {
    if (this._anchor) {
      const { worldX, worldY, screenX, screenY } = this._anchor;
      this.position.x     = screenX / this.zoom - worldX;
      this.position.y     = screenY / this.zoom - worldY;
      this.destPosition.x = worldX - screenX / this.destZoom;
      this.destPosition.y = worldY - screenY / this.destZoom;
      if (Math.abs(this.zoom - this.destZoom) < 0.001) {
        this.zoom = this.destZoom;
        this._anchor = null;
      }
      return;
    }
    this.position.x = -lerp(-this.position.x, this.destPosition.x, this.gameConfig.camera.positionLerpSpeed);
    this.position.y = -lerp(-this.position.y, this.destPosition.y, this.gameConfig.camera.positionLerpSpeed);
  }

  updateZoom() {
    this.zoom = lerp(this.zoom, this.destZoom, this.gameConfig.camera.zoomLerpSpeed);
    scaledCanvas.width  = canvas.width  / this.zoom;
    scaledCanvas.height = canvas.height / this.zoom;
  }

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

  pan({ dx = 0, dy = 0 }) {
    this._anchor = null;
    this._tween  = null;
    if (dx !== 0) { this.destPosition.x = this._clampX(this.destPosition.x + dx); }
    if (dy !== 0) { this.destPosition.y = this._clampY(this.destPosition.y + dy); }
  }

  panCamera({ object }) {
    if (this._followTarget && object !== this._followTarget) { return; }
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
      if (sa) return { x: clampX(sa.hitbox.position.x + sa.hitbox.width / 2 - w / 2), y: clampY(sa.hitbox.position.y + sa.hitbox.height / 2 - h / 2) };
    }
    if (key === "finishArea") {
      const fa = gameServices.finishArea;
      if (fa) return { x: clampX(fa.hitbox.position.x + fa.hitbox.width / 2 - w / 2), y: clampY(fa.hitbox.position.y + fa.hitbox.height / 2 - h / 2) };
    }
    return { x: position.x, y: position.y };
  }

  setPosition({ position = { x: 0, y: 0 }, key = undefined }) {
    this._anchor = null;
    this._tween  = null;
    const target = this._resolvePosition({ key, position });
    this.destPosition.x = target.x;
    this.destPosition.y = target.y;
    this.position.x = -target.x;
    this.position.y = -target.y;
  }

  moveTo({ position = { x: 0, y: 0 }, key = undefined }) {
    this._anchor = null;
    this._tween  = null;
    const target = this._resolvePosition({ key, position });
    this.destPosition.x = target.x;
    this.destPosition.y = target.y;
  }

  setZoom(zoom) {
    this._anchor  = null;
    this._tween   = null;
    this.destZoom = zoom;
  }

  // Zoom and pan to center a key area on screen — single coupled motion via tween.
  zoomToKey({ zoom, key }) {
    this._anchor = null;
    this.destZoom = zoom; // set before _resolvePosition so it uses the target zoom
    const pos = this._resolvePosition({ key });
    this._tween = { endZoom: zoom, endPX: pos.x, endPY: pos.y };
    this.destPosition.x = pos.x;
    this.destPosition.y = pos.y;
  }

  // Zoom to place a world coordinate at screen center — single coupled motion via tween.
  zoomToWorldCenter({ zoom, worldX, worldY }) {
    this._anchor = null;
    this.destZoom = zoom;
    const endPX = worldX - canvas.width  / (2 * zoom);
    const endPY = worldY - canvas.height / (2 * zoom);
    this._tween = { endZoom: zoom, endPX, endPY };
    this.destPosition.x = endPX;
    this.destPosition.y = endPY;
  }

  // Returns the world coordinate currently at screen center.
  getWorldCenter() {
    return {
      worldX: this.destPosition.x + canvas.width  / (2 * this.destZoom),
      worldY: this.destPosition.y + canvas.height / (2 * this.destZoom)
    };
  }

  focusOn({ position, width, height, zoom }) {
    this.clearFollowTarget();
    this.zoomToWorldCenter({ zoom, worldX: position.x + width / 2, worldY: position.y + height / 2 });
  }

  snapZoom(zoom) {
    this._anchor = null;
    this._tween  = null;
    this.zoom = zoom;
    this.destZoom = zoom;
    scaledCanvas.width  = canvas.width  / zoom;
    scaledCanvas.height = canvas.height / zoom;
  }

  // Zoom centred on the cursor — uses anchor so the cursor's canvas position stays fixed.
  // No teleport at hover start: the cursor's world/screen coords are derived from the current
  // camera state, so position.x is unchanged on frame 1.
  zoomToCursor(zoom, cursor) {
    this._tween = null;
    const screenX = (cursor.canvasPosition.x + this.position.x) * this.zoom;
    const screenY = (cursor.canvasPosition.y + this.position.y) * this.zoom;
    this.destZoom = zoom;
    this._anchor = { worldX: cursor.canvasPosition.x, worldY: cursor.canvasPosition.y, screenX, screenY };
  }

  getOverviewZoom() {
    const bg = gameServices.background;
    return Math.min(canvas.width / bg.width, canvas.height / bg.height);
  }
}
