import { ctx, debugMode } from '../core/RenderContext.js';

// CollisionBlock - Solid world geometry (physics only, no damage)
class CollisionBlock {
    constructor({ position, width, height, isWallSlide = true }) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.isWallSlide = isWallSlide;
    }

    render() {
        if (!debugMode) { return; }
        ctx.fillStyle = "rgba(255, 0, 0, .3)";
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

// DamageBlock - Solid damage zone (physics + hurtbox damage)
class DamageBlock {
    constructor({ position, width, height, type = 'default' }) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    render() {
        if (!debugMode) { return; }
        ctx.fillStyle = "rgba(255, 165, 0, .4)";
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

export class CollisionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.blocks = [];
    this.damageBlocks = [];
  }

  initialize() {}
  update() {}

  shutdown() {
    this.blocks = [];
    this.damageBlocks = [];
  }

  createBlock(config) {
    const block = new CollisionBlock(config);
    this.blocks.push(block);
    return block;
  }

  removeBlock(block) {
    const idx = this.blocks.indexOf(block);
    if (idx !== -1) { this.blocks.splice(idx, 1); }
  }

  createDamageBlock(config) {
    const damageBlock = new DamageBlock(config);
    this.damageBlocks.push(damageBlock);
    return damageBlock;
  }

  removeDamageBlock(damageBlock) {
    const idx = this.damageBlocks.indexOf(damageBlock);
    if (idx !== -1) { this.damageBlocks.splice(idx, 1); }
  }

  // Velocity-independent overlap check — fires die() whenever hurtbox touches any damage block.
  // Used instead of checkHorizontal/VerticalCollisions for damage so stationary players are also hit.
  checkDamage(entity, hurtbox, damageBlocks) {
    if (entity.dead) { return; }
    for (const block of damageBlocks) {
      if (this.isColliding(hurtbox, block)) {
        entity.die(block.type);
        return;
      }
    }
  }

  isColliding(obj1, obj2) {
    return (
      obj1.position.x < obj2.position.x + obj2.width &&
      obj1.position.x + obj1.width > obj2.position.x &&
      obj1.position.y < obj2.position.y + obj2.height &&
      obj1.position.y + obj1.height > obj2.position.y
    );
  }

  checkHorizontalCollisions(entity, box, staticBlocks) {
    const isHitbox = box === entity.hitbox;
    if (isHitbox) {
      entity.touchingWall = entity.touchingWall || { left: false, right: false };
      entity.touchingWall.left = false;
      entity.touchingWall.right = false;
    }

    for (let i in staticBlocks) {
      const block = staticBlocks[i];
      const widerBlock = {
        position: { x: block.position.x - 1, y: block.position.y },
        width: block.width + 2,
        height: block.height
      };

      if (this.isColliding(box, widerBlock)) {
        if (isHitbox && block.isWallSlide) {
          if (box.position.x >= block.position.x + block.width - 1) {
            entity.touchingWall.left = true;
          } else if (box.position.x + box.width <= block.position.x + 1) {
            entity.touchingWall.right = true;
          }
        }

        if (
          box.position.x <= block.position.x + block.width &&
          box.position.x + box.width >= block.position.x
        ) {
          if (entity.velocity.x < 0) {
            if (isHitbox && block.isWallSlide) { entity.touchingWall.left = true; }
            entity.velocity.x = 0;
            const offset = box.position.x - entity.position.x;
            entity.position.x = block.position.x + block.width - offset + 0.01;
            break;
          }
          if (entity.velocity.x > 0) {
            if (isHitbox && block.isWallSlide) { entity.touchingWall.right = true; }
            entity.velocity.x = 0;
            const offset = box.position.x - entity.position.x + box.width;
            entity.position.x = block.position.x - offset - 0.01;
            break;
          }
        }
      }
    }
  }

  checkVerticalCollisions(entity, box, staticBlocks) {
    const isHitbox = box === entity.hitbox;
    if (isHitbox) { entity.grounded = false; }

    for (let i in staticBlocks) {
      const block = staticBlocks[i];

      if (this.isColliding(box, block)) {
        if (entity.velocity.y > 0) {
          entity.velocity.y = 0;
          const offset = box.position.y - entity.position.y + box.height;
          entity.position.y = block.position.y - offset - 0.01;
          if (isHitbox) { entity.grounded = true; }
          break;
        }
        if (entity.velocity.y < 0) {
          entity.velocity.y = 0;
          const offset = box.position.y - entity.position.y;
          entity.position.y = block.position.y + block.height - offset + 0.01;
          break;
        }
      }
    }
  }
}
