import { ctx, debugMode } from '../core/renderContext.js';

// CollisionBlock - A static world-geometry entity that participates in collision detection
class CollisionBlock {
    constructor({position, width, height, death = false, placingPhaseCollision = true}) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.death = death;
        this.wallSlide = !death;
        this.placingPhaseCollision = placingPhaseCollision;
    }

    render() {
        if (!debugMode) { return; }
        ctx.fillStyle = "rgba(255, 0, 0, .3)";
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

// CollisionSystem - Centralized collision detection and handling

export class CollisionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.blocks = [];
  }

  initialize() {}
  update() {}

  shutdown() {
    this.blocks = [];
  }

  createBlock(config) {
    const block = new CollisionBlock(config);
    this.blocks.push(block);
    return block;
  }

  isColliding(obj1, obj2) {
    return (
      obj1.position.x < obj2.position.x + obj2.width &&
      obj1.position.x + obj1.width > obj2.position.x &&
      obj1.position.y < obj2.position.y + obj2.height &&
      obj1.position.y + obj1.height > obj2.position.y
    );
  }

  // onDeathBlock: optional callback invoked when entity overlaps a death block
  checkHorizontalCollisions(entity, staticBlocks, onDeathBlock = null) {
    entity.touchingWall = entity.touchingWall || { left: false, right: false };
    entity.touchingWall.left = false;
    entity.touchingWall.right = false;

    for (let i in staticBlocks) {
      const block = staticBlocks[i];
      const widerBlock = {
        position: { x: block.position.x - 1, y: block.position.y },
        width: block.width + 2,
        height: block.height
      };

      if (this.isColliding(entity.hitbox, widerBlock)) {
        if (block.wallSlide) {
          if (entity.hitbox.position.x >= block.position.x + block.width - 1) {
            entity.touchingWall.left = true;
          } else if (entity.hitbox.position.x + entity.hitbox.width <= block.position.x + 1) {
            entity.touchingWall.right = true;
          }
        }

        if (
          entity.hitbox.position.x <= block.position.x + block.width &&
          entity.hitbox.position.x + entity.hitbox.width >= block.position.x
        ) {
          if (block.death && onDeathBlock) { onDeathBlock(); }
          if (entity.velocity.x < 0) {
            entity.velocity.x = 0;
            const offset = entity.hitbox.position.x - entity.position.x;
            entity.position.x = block.position.x + block.width - offset + 0.01;
            break;
          }
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

  // onDeathBlock: optional callback invoked when entity overlaps a death block
  checkVerticalCollisions(entity, staticBlocks, onDeathBlock = null) {
    entity.grounded = false;

    for (let i in staticBlocks) {
      const block = staticBlocks[i];

      if (this.isColliding(entity.hitbox, block)) {
        if (block.death && onDeathBlock) { onDeathBlock(); }
        if (entity.velocity.y > 0) {
          entity.velocity.y = 0;
          const offset = entity.hitbox.position.y - entity.position.y + entity.hitbox.height;
          entity.position.y = block.position.y - offset - 0.01;
          entity.grounded = true;
          break;
        }
        if (entity.velocity.y < 0) {
          entity.velocity.y = 0;
          const offset = entity.hitbox.position.y - entity.position.y;
          entity.position.y = block.position.y + block.height - offset + 0.01;
          break;
        }
      }
    }

    return { grounded: entity.grounded };
  }

}
