// CollisionSystem - Centralized collision detection and handling

class CollisionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
  }

  initialize() {
    // Nothing to initialize
  }

  update() {
    // Collision is applied per-entity, not globally
  }

  shutdown() {
    // Nothing to cleanup
  }

  /**
   * Base collision detection between two rectangles
   * @param {Object} obj1 - Object with position, width, height
   * @param {Object} obj2 - Object with position, width, height
   * @returns {boolean} - True if objects collide
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
   * Check horizontal collisions for entity
   * @param {Object} entity - Moving entity with hitbox and velocity
   * @param {Array} staticBlocks - Array of collision blocks
   * @returns {Object} - { touchingWallLeft, touchingWallRight, collided }
   */
  checkHorizontalCollisions(entity, staticBlocks) {
    entity.touchingWall = entity.touchingWall || { left: false, right: false };
    entity.touchingWall.left = false;
    entity.touchingWall.right = false;

    for (let i in staticBlocks) {
      const block = staticBlocks[i];
      const widerCollisionBlock = {
        position: { x: block.position.x - 1, y: block.position.y },
        width: block.width + 2,
        height: block.height
      };

      if (this.isColliding(entity.hitbox, widerCollisionBlock)) {
        // Check for wall slide (wall-slide capable block)
        if (block.wallSlide) {
          if (entity.hitbox.position.x >= block.position.x + block.width - 1) {
            entity.touchingWall.left = true;
          } else if (entity.hitbox.position.x + entity.hitbox.width <= block.position.x + 1) {
            entity.touchingWall.right = true;
          }
        }

        // Check overlap for collision response
        if (
          entity.hitbox.position.x <= block.position.x + block.width &&
          entity.hitbox.position.x + entity.hitbox.width >= block.position.x
        ) {
          // Left collision (moving left)
          if (entity.velocity.x < 0) {
            entity.velocity.x = 0;
            const offset = entity.hitbox.position.x - entity.position.x;
            entity.position.x = block.position.x + block.width - offset + 0.01;
            break;
          }
          // Right collision (moving right)
          if (entity.velocity.x > 0) {
            entity.velocity.x = 0;
            const offset = entity.hitbox.position.x - entity.position.x + entity.hitbox.width;
            entity.position.x = block.position.x - offset - 0.01;
            break;
          }
        }
      }
    }

    return {
      touchingWallLeft: entity.touchingWall.left,
      touchingWallRight: entity.touchingWall.right
    };
  }

  /**
   * Check vertical collisions for entity
   * @param {Object} entity - Moving entity with hitbox and velocity
   * @param {Array} staticBlocks - Array of collision blocks
   * @returns {Object} - { grounded, collided }
   */
  checkVerticalCollisions(entity, staticBlocks) {
    entity.grounded = false;

    for (let i in staticBlocks) {
      const block = staticBlocks[i];

      if (this.isColliding(entity.hitbox, block)) {
        // Bottom collision (falling down)
        if (entity.velocity.y > 0) {
          entity.velocity.y = 0;
          const offset = entity.hitbox.position.y - entity.position.y + entity.hitbox.height;
          entity.position.y = block.position.y - offset - 0.01;
          entity.grounded = true;
          break;
        }
        // Top collision (moving up)
        if (entity.velocity.y < 0) {
          entity.velocity.y = 0;
          const offset = entity.hitbox.position.y - entity.position.y;
          entity.position.y = block.position.y + block.height - offset + 0.01;
          break;
        }
      }
    }

    return {
      grounded: entity.grounded
    };
  }

  /**
   * Check canvas boundaries collision (horizontal)
   * @param {Object} entity - Entity to check
   * @param {number} canvasWidth - Canvas boundary width
   */
  checkCanvasBoundaries(entity, canvasWidth) {
    if (
      entity.hitbox.position.x + entity.hitbox.width + entity.velocity.x >= canvasWidth ||
      entity.hitbox.position.x + entity.velocity.x <= 0
    ) {
      entity.velocity.x = 0;
    }
  }

  /**
   * Perform full collision check sequence (horizontal then vertical)
   * @param {Object} entity - Entity to check
   * @param {Array} blocks - Collision blocks
   * @param {number} canvasWidth - Canvas width for boundary check
   */
  performCollisionChecks(entity, blocks, canvasWidth) {
    this.checkCanvasBoundaries(entity, canvasWidth);
    this.checkHorizontalCollisions(entity, blocks);
    this.checkVerticalCollisions(entity, blocks);

    // Update coyote time based on grounded state
    if (entity.velocity.y < 0) {
      entity.coyoteTime = 0;
    } else if (entity.grounded || entity.touchingWall.right || entity.touchingWall.left) {
      entity.coyoteTime = this.gameConfig.jump.coyoteTime;
    }
  }

  /**
   * Check if entity collides with any block at a position
   * @param {Object} entity - Entity to check
   * @param {Array} blocks - Array of blocks
   * @returns {Object|null} - First block collided with or null
   */
  getCollidingBlock(entity, blocks) {
    for (let i in blocks) {
      if (this.isColliding(entity.hitbox, blocks[i])) {
        return blocks[i];
      }
    }
    return null;
  }

  query(question) {
    switch (question) {
      case 'coyoteTime':
        return this.gameConfig.jump.coyoteTime;
      default:
        return null;
    }
  }
}

// Create singleton instance (initialized in GameServices)
let collisionSystem;
