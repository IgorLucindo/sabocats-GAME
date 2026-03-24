// AnimationSystem - Centralized sprite frame animation management

import { Logger } from '../core/Logger.js';

export class AnimationSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
  }

  initialize() {
    // Nothing to initialize
  }

  update() {
    // Animation updates are per-entity, not global
  }

  shutdown() {
    // Nothing to cleanup
  }

  /**
   * Update animation frames for a sprite-based entity
   * @param {Object} entity - Entity with animation properties (Sprite-based)
   * @param {number} deltaTime - Frame delta time (optional, uses entity.frameBuffer if not provided)
   */
  updateFrame(entity, deltaTime = null) {
    if (!entity.frameRate || !entity.image || !entity.imageLoaded) {
      return;
    }

    entity.elapsedFrames = entity.elapsedFrames || 0;
    entity.currentFrame = entity.currentFrame || 0;
    entity.frameBuffer = entity.frameBuffer || 1;

    entity.elapsedFrames++;

    if (entity.elapsedFrames >= entity.frameBuffer) {
      entity.elapsedFrames = 0;
      entity.currentFrame++;

      if (entity.currentFrame >= entity.frameRate) {
        entity.currentFrame = 0;
      }
    }
  }

  /**
   * Reset animation to first frame
   * @param {Object} entity - Entity with animation properties
   */
  resetAnimation(entity) {
    entity.elapsedFrames = 0;
    entity.currentFrame = 0;
  }

  /**
   * Switch sprite to a new animation
   * @param {Object} entity - Entity with animations and image tracking
   * @param {string} animationKey - Key of animation to switch to
   * @param {Object} animations - Animations object containing texture/frameRate/frameBuffer
   */
  switchAnimation(entity, animationKey, animations) {
    if (!animations[animationKey]) {
      Logger.warn(`Animation not found: ${animationKey}`);
      return;
    }

    const animation = animations[animationKey];

    // Don't switch if already on this animation
    if (entity.image === animation.image && entity.imageLoaded) {
      return;
    }

    // Reset animation and load new image
    this.resetAnimation(entity);
    entity.image = animation.image;
    entity.frameRate = animation.frameRate;
    entity.frameBuffer = animation.frameBuffer || 1;
    entity.lastAnimationKey = animationKey;
  }

  /**
   * Get sprite animation key based on player state
   * @param {Object} player - Player entity
   * @returns {string} - Animation key to use
   */
  getSpriteForState(player) {
    if (player.dead) {
      return `${player.lastSprite}Dead`;
    }

    // Determine direction
    const direction = player.lastDirection === 'left' ? 'Left' : 'Right';

    // Air state (jumping/falling)
    if (!player.grounded) {
      if (player.velocity.y < 0) {
        return `jump${direction}`;
      } else {
        return `fall${direction}`;
      }
    }

    // Grounded states
    if (player.velocity.x !== 0) {
      // Moving
      return `walk${direction}`;
    } else if (player.touchingWall?.left || player.touchingWall?.right) {
      // Wall slide
      return `wallSlide${direction}`;
    } else {
      // Idle/Sitting
      return 'idleSit';
    }
  }

  /**
   * Get sprite animation key for online player (no dead state)
   * @param {Object} onlinePlayer - Online player entity
   * @param {Object} player - Local player reference (for direction)
   * @returns {string} - Animation key to use
   */
  getSpriteForOnlinePlayer(onlinePlayer, player) {
    const direction = onlinePlayer.lastDirection === 'left' ? 'Left' : 'Right';

    if (!onlinePlayer.grounded) {
      if (onlinePlayer.velocity.y < 0) {
        return `jump${direction}`;
      } else {
        return `fall${direction}`;
      }
    }

    if (onlinePlayer.velocity.x !== 0) {
      return `walk${direction}`;
    } else if (onlinePlayer.touchingWall?.left || onlinePlayer.touchingWall?.right) {
      return `wallSlide${direction}`;
    } else {
      return 'idleSit';
    }
  }

  query(question) {
    switch (question) {
      case 'frameRate':
        return 'varies per animation';
      default:
        return null;
    }
  }
}
