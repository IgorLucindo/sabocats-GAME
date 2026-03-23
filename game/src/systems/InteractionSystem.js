// InteractableArea - A world zone that triggers actions when the player enters it
class InteractableArea extends Sprite {
    constructor({position, hitbox, texture, scale, pressable = false, func, highlightable = false}) {
        super({position, texture, scale, highlightUp: true});
        this.hitbox = hitbox;
        this.hitbox.position = {x: position.x, y: position.y};
        this.func = func;
        this.pressable = pressable;
        this.highlightable = highlightable;
        this.highlighted = false;

        if (pressable && highlightable) {
            this.keySprite = new Sprite({
                position: {x: this.position.x, y: this.position.y},
                texture: "assets/textures/keys/e.png",
                frameRate: GameConfig.ui.keySprite.frameRate,
                frameBuffer: GameConfig.ui.keySprite.frameBuffer
            });
            const keySpriteSize = GameConfig.ui.keySprite.size;
            this.keySprite.position.x += (this.hitbox.width - keySpriteSize) / 2;
            this.keySprite.position.y -= (keySpriteSize + GameConfig.ui.keySprite.offsetY);
        }
    }



    // update area — check player overlap and trigger func
    update() {
        this.resetStates();
        if (player.loaded && collision({object1: player.hitbox, object2: this.hitbox})) {
            if (this.highlightable) { this.highlighted = true; }
            if ((this.pressable && !keys.e.previousPressed && keys.e.pressed) || !this.pressable) {
                this.func();
            }
        }
    }



    // render area with debug overlay, key prompt, and highlight
    render() {
        ctx.save();
        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 255, .2)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        }

        if (this.highlighted) {
            this.keySprite.updateFrames();
            this.keySprite.draw();
        }
        this.renderHighlight();
        this.draw();
        ctx.restore();
    }



    // reset per-frame states
    resetStates() {
        this.highlighted = false;
    }
}



// InteractionSystem - Centralized collision-based interaction handling

class InteractionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.areas = [];
  }

  initialize() {
    // Nothing to initialize
  }

  // Update all interactable areas
  update() {
    for(let i in this.areas) {
        this.areas[i].update();
    };
  }

  shutdown() {
    this.areas = [];
  }

  /**
   * Create and register an interactable area
   * @param {Object} config - Area configuration
   * @returns {InteractableArea} - Created area
   */
  createArea(config) {
    const area = new InteractableArea(config);
    this.areas.push(area);
    return area;
  }

  /**
   * Get all interactable areas
   * @returns {Array} - Array of interactable areas
   */
  getAreas() {
    return this.areas;
  }

  /**
   * Check if entity collides with any interactable area
   * @param {Object} entity - Entity to check (typically player)
   * @param {Array} areas - Array of interactable areas
   * @returns {Object|null} - First area collided with or null
   */
  getCollidingArea(entity, areas) {
    for (let i in areas) {
      const area = areas[i];
      if (this.isColliding(entity.hitbox, area)) {
        return area;
      }
    }
    return null;
  }

  /**
   * Check collision between two rectangles
   * @param {Object} obj1 - Object with position, width, height
   * @param {Object} obj2 - Object with position, width, height
   * @returns {boolean} - True if colliding
   */
  isColliding(obj1, obj2) {
    return (
      obj1.position.x < obj2.position.x + obj2.width &&
      obj1.position.x + obj1.width > obj2.position.x &&
      obj1.position.y < obj2.position.y + obj2.height &&
      obj1.position.y + obj1.height > obj2.position.y
    );
  }

  /**
   * Check interactions for an entity with all areas
   * @param {Object} entity - Entity to check
   * @param {Array} areas - Array of interactable areas
   * @returns {Array} - Array of areas entity is colliding with
   */
  checkInteractions(entity, areas) {
    const collidingAreas = [];
    for (let i in areas) {
      const area = areas[i];
      if (this.isColliding(entity.hitbox, area)) {
        collidingAreas.push(area);
      }
    }
    return collidingAreas;
  }

  /**
   * Trigger an interaction with an area
   * @param {Object} area - Interactable area
   */
  triggerInteraction(area) {
    if (area.onInteract) {
      area.onInteract();
    }
  }

  /**
   * Call update on all interactable areas
   * @param {Array} areas - Array of interactable areas
   */
  updateAreas(areas) {
    for (let i in areas) {
      if (areas[i].update) {
        areas[i].update();
      }
    }
  }

  query(question) {
    switch (question) {
      case 'interactionSystemInitialized':
        return true;
      default:
        return null;
    }
  }
}
