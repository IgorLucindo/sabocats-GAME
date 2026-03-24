// PlayerControlSystem - Centralized player control handling (movement, jump, wall-slide)

export class PlayerControlSystem {
  constructor({ inputSystem, physicsSystem, collisionSystem, gameConfig }) {
    this.inputSystem = inputSystem;
    this.physicsSystem = physicsSystem;
    this.collisionSystem = collisionSystem;
    this.gameConfig = gameConfig;
  }

  initialize() {
    // Nothing to initialize
  }

  update() {
    // Controls are applied per-player, not globally
  }

  shutdown() {
    // Nothing to cleanup
  }

  /**
   * Process player movement input (acceleration/deceleration)
   * @param {Object} player - Player entity
   * @param {Object} inputState - Input state from InputSystem
   */
  processMovement(player, inputState) {
    const isMovingRight = inputState.isMovingRight || this.inputSystem.isKeyPressed('d');
    const isMovingLeft = inputState.isMovingLeft || this.inputSystem.isKeyPressed('a');
    const isSprinting = this.inputSystem.isKeyPressed('shift');

    const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * player.scale;
    const walkAcceleration = (this.gameConfig.movement.walk.acceleration + this.gameConfig.movement.deceleration) * player.scale;
    const runMaxVelocity = this.gameConfig.movement.run.maxVelocity * player.scale;
    const runAcceleration = (this.gameConfig.movement.run.acceleration + this.gameConfig.movement.deceleration) * player.scale;

    // Moving right
    if (isMovingRight && !isMovingLeft) {
      // Handle wall slide
      if (!player.grounded) {
        // Stop wall sliding (frame counter in Player)
        if (player.touchingWall.left) {
          if (!player.wallSlideFrameCounter) {
            player.wallSlideFrameCounter = 0;
          }
          if (player.wallSlideFrameCounter < this.gameConfig.jump.stopWallSlidingFrames) {
            player.wallSlideFrameCounter++;
            return;
          } else {
            player.wallSlideFrameCounter = 0;
            player.touchingWall.left = false;
            player.position.x++;
          }
        }
      }

      // Apply acceleration
      const maxVel = isSprinting ? runMaxVelocity : walkMaxVelocity;
      const accel = isSprinting ? runAcceleration : walkAcceleration;
      player.velocity.x = Math.min(player.velocity.x + accel, maxVel);
      player.lastDirection = 'right';
    }
    // Moving left
    else if (isMovingLeft && !isMovingRight) {
      // Handle wall slide
      if (!player.grounded) {
        if (player.touchingWall.right) {
          if (!player.wallSlideFrameCounter) {
            player.wallSlideFrameCounter = 0;
          }
          if (player.wallSlideFrameCounter < this.gameConfig.jump.stopWallSlidingFrames) {
            player.wallSlideFrameCounter++;
            return;
          } else {
            player.wallSlideFrameCounter = 0;
            player.touchingWall.right = false;
            player.position.x--;
          }
        }
      }

      // Apply acceleration
      const maxVel = isSprinting ? runMaxVelocity : walkMaxVelocity;
      const accel = isSprinting ? runAcceleration : walkAcceleration;
      player.velocity.x = Math.max(player.velocity.x - accel, -maxVel);
      player.lastDirection = 'left';
    }
  }

  /**
   * Process jump input with coyote time and jump buffer
   * @param {Object} player - Player entity
   * @param {number} deltaTime - Frame delta time
   */
  processJumpInput(player, deltaTime) {
    const isSpacePressed = this.inputSystem.isKeyPressed('space');
    const wasSpacePressedPreviously = player.jumpBufferTime > 0; // Simplified tracking

    // Update jump buffer
    if (!wasSpacePressedPreviously && isSpacePressed) {
      player.jumpBufferTime = this.gameConfig.jump.jumpBuffer;
    } else if (isSpacePressed) {
      player.jumpBufferTime -= deltaTime;
    }

    // If jump buffer and coyote time available, jump
    if (player.jumpBufferTime > 0 && player.coyoteTime > 0) {
      this.executeJump(player);
    }

    // Early jump release (reduce jump height)
    if (!isSpacePressed && player.velocity.y < 0) {
      player.velocity.y /= 2;
    }
  }

  /**
   * Execute a jump (vertical and wall-slide variants)
   * @param {Object} player - Player entity
   */
  executeJump(player) {
    player.jumped = true;
    player.jumpBufferTime = 0;

    // Vertical jump
    player.velocity.y = -this.gameConfig.jump.jumpVelocity * player.scale;

    // Wall-slide jump with horizontal velocity
    if ((player.touchingWall.right || player.touchingWall.left) && !player.grounded) {
      const isSprinting = this.inputSystem.isKeyPressed('shift');
      let horizontalWallSlideJumpVelocity = this.gameConfig.jump.wallSlideJumpVelocity * player.scale;

      if (isSprinting) {
        horizontalWallSlideJumpVelocity = this.gameConfig.jump.wallSlideSprintJumpVelocity * player.scale;
      }

      if (player.touchingWall.right) {
        player.velocity.x = -horizontalWallSlideJumpVelocity;
      } else if (player.touchingWall.left) {
        player.velocity.x = horizontalWallSlideJumpVelocity;
      }
    }
  }

  /**
   * Process wall-slide physics
   * @param {Object} player - Player entity
   */
  processWallSlide(player) {
    if (!player.grounded) {
      const isWallSliding = this.inputSystem.isKeyPressed('w');
      let wallSlideVelocity = this.gameConfig.jump.wallSlideVelocity * player.scale;

      if (isWallSliding) {
        wallSlideVelocity *= 0.2;
      }

      if (player.touchingWall.right) {
        if (player.velocity.y > wallSlideVelocity) {
          player.velocity.y = wallSlideVelocity;
        }
        player.lastDirection = 'left';
      } else if (player.touchingWall.left) {
        if (player.velocity.y > wallSlideVelocity) {
          player.velocity.y = wallSlideVelocity;
        }
        player.lastDirection = 'right';
      }
    }
  }

  /**
   * Apply all player controls
   * @param {Object} player - Player entity
   * @param {number} deltaTime - Frame delta time
   * @param {Object} inputState - Optional pre-computed input state
   */
  applyPlayerControls(player, deltaTime, inputState = null) {
    if (player.dead) {
      return;
    }

    if (!inputState) {
      inputState = this.inputSystem.getMouseState();
      inputState.isMovingRight = this.inputSystem.query('isMovingRight');
      inputState.isMovingLeft = this.inputSystem.query('isMovingLeft');
    }

    this.processMovement(player, inputState);
    this.processJumpInput(player, deltaTime);
    this.processWallSlide(player);
  }

  query(question) {
    switch (question) {
      case 'jumpBuffer':
        return this.gameConfig.jump.jumpBuffer;
      case 'coyoteTime':
        return this.gameConfig.jump.coyoteTime;
      default:
        return null;
    }
  }
}
