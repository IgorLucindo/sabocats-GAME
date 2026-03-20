// CameraSystem - Centralized camera control and following logic

class CameraSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    // Create camera object with essential properties
    this.camera = {
      position: { x: 0, y: 0 },
      zoom: 1,
      canvas: { width: 0, height: 0 },
      setZoom: (zoomLevel) => { this.camera.zoom = zoomLevel; },
      setPosition: (pos) => {
        if (typeof pos === 'object' && pos.key) {
          // Handle named positions
          if (pos.key === 'middle') {
            this.camera.position.x = 0;
            this.camera.position.y = 0;
          }
        } else if (typeof pos === 'object') {
          // Handle direct position
          this.camera.position.x = pos.x || this.camera.position.x;
          this.camera.position.y = pos.y || this.camera.position.y;
        }
      }
    };
    this.mode = 'free'; // 'free', 'follow', 'fixed'
    this.target = null;
    this.lerpSpeed = 0.1;
  }

  initialize() {
    // Camera already initialized in GameServices
  }

  update() {
    // Camera updates handled by Camera.update()
    // This system provides high-level control
  }

  shutdown() {
    this.target = null;
  }

  /**
   * Set camera to follow a target
   * @param {Object} target - Object with position property
   * @param {number} lerpSpeed - Camera lerp speed (0-1)
   */
  follow(target, lerpSpeed = 0.1) {
    this.mode = 'follow';
    this.target = target;
    this.lerpSpeed = lerpSpeed;
  }

  /**
   * Set camera to fixed position
   * @param {Object} position - {x, y} position
   */
  setFixed(position) {
    this.mode = 'fixed';
    this.target = null;
    if (this.camera) {
      this.camera.position.x = position.x;
      this.camera.position.y = position.y;
    }
  }

  /**
   * Set camera to free pan mode
   */
  setFreeMode() {
    this.mode = 'free';
    this.target = null;
  }

  /**
   * Set camera zoom level
   * @param {number} zoomLevel - Zoom value (e.g., 1, 2, 0.5)
   */
  setZoom(zoomLevel) {
    if (this.camera) {
      this.camera.setZoom(zoomLevel);
    }
  }

  /**
   * Get current zoom level
   * @returns {number} - Current zoom
   */
  getZoom() {
    return this.camera ? this.camera.zoom : 1;
  }

  /**
   * Pan camera in a direction
   * @param {string} direction - 'up', 'down', 'left', 'right'
   * @param {number} speed - Pan speed
   */
  pan(direction, speed = 10) {
    if (!this.camera) return;

    switch (direction) {
      case 'up':
        this.camera.position.y -= speed;
        break;
      case 'down':
        this.camera.position.y += speed;
        break;
      case 'left':
        this.camera.position.x -= speed;
        break;
      case 'right':
        this.camera.position.x += speed;
        break;
    }
  }

  /**
   * Set camera position directly
   * @param {Object} position - {x, y} position
   */
  setPosition(position) {
    if (this.camera) {
      this.camera.position.x = position.x;
      this.camera.position.y = position.y;
    }
  }

  /**
   * Get camera position
   * @returns {Object} - {x, y} camera position
   */
  getPosition() {
    return this.camera ? { ...this.camera.position } : { x: 0, y: 0 };
  }

  /**
   * Set camera named position (by preset)
   * @param {string} positionKey - Preset position name ('middle', 'start', etc)
   */
  setNamedPosition(positionKey) {
    if (this.camera && this.camera.setPosition) {
      this.camera.setPosition({ key: positionKey });
    }
  }

  /**
   * Get camera bounds (visible area)
   * @returns {Object} - {x, y, width, height}
   */
  getViewBounds() {
    if (!this.camera) return { x: 0, y: 0, width: 800, height: 600 };

    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      width: this.camera.canvas.width / this.camera.zoom,
      height: this.camera.canvas.height / this.camera.zoom
    };
  }

  /**
   * Check if object is in camera view
   * @param {Object} object - Object with position, width, height
   * @returns {boolean}
   */
  isInView(object) {
    const bounds = this.getViewBounds();
    return !(
      object.position.x + object.width < bounds.x ||
      object.position.x > bounds.x + bounds.width ||
      object.position.y + object.height < bounds.y ||
      object.position.y > bounds.y + bounds.height
    );
  }

  query(question) {
    switch (question) {
      case 'cameraMode':
        return this.mode;
      case 'zoomLevel':
        return this.getZoom();
      case 'position':
        return this.getPosition();
      default:
        return null;
    }
  }
}

// Create singleton instance (initialized in GameServices)
let cameraSystem;
