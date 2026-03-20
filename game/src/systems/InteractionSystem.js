// InteractionSystem - Centralized collision-based interaction handling

class InteractionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
  }

  initialize() {
    // Nothing to initialize
  }

  update() {
    // Interactions are per-entity, checked in logic updates
  }

  shutdown() {
    // Nothing to cleanup
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

// Create singleton instance (initialized in GameServices)
let interactionSystem;
