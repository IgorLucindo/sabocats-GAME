// PhysicsSystem - Centralized physics calculations (gravity, velocity, acceleration)

class PhysicsSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
  }

  initialize() {
    // Nothing to initialize
  }

  update() {
    // Physics is applied per-entity, not globally
  }

  shutdown() {
    // Nothing to cleanup
  }

  /**
   * Apply gravity to an entity
   * @param {Object} entity - Entity with velocity, gravityMultiplier properties
   * @param {number} deltaTime - Frame delta time
   */
  applyGravity(entity, deltaTime) {
    const tickrateCorrection = 60 * deltaTime;
    entity.velocity.y += this.gameConfig.physics.gravity * entity.gravityMultiplier * tickrateCorrection * entity.scale;
  }

  /**
   * Apply velocity to entity position
   * @param {Object} entity - Entity with position and velocity
   * @param {number} deltaTime - Frame delta time
   */
  applyVelocity(entity, deltaTime, direction = 'both') {
    const tickrateCorrection = 60 * deltaTime;

    if (direction === 'horizontal' || direction === 'both') {
      entity.position.x += Math.round(entity.velocity.x / entity.scale) * entity.scale * tickrateCorrection;
    }

    if (direction === 'vertical' || direction === 'both') {
      entity.position.y += entity.velocity.y * tickrateCorrection;
    }
  }

  /**
   * Accelerate entity in a direction
   * @param {Object} entity - Entity with velocity
   * @param {string} direction - 'left' or 'right'
   * @param {boolean} isSprinting - Whether currently sprinting
   */
  accelerateHorizontal(entity, direction, isSprinting = false) {
    const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;
    const walkAcceleration = (this.gameConfig.movement.walk.acceleration + this.gameConfig.movement.deceleration) * entity.scale;
    const runMaxVelocity = this.gameConfig.movement.run.maxVelocity * entity.scale;
    const runAcceleration = (this.gameConfig.movement.run.acceleration + this.gameConfig.movement.deceleration) * entity.scale;

    if (direction === 'right') {
      const maxVel = isSprinting ? runMaxVelocity : walkMaxVelocity;
      const accel = isSprinting ? runAcceleration : walkAcceleration;
      entity.velocity.x = Math.min(entity.velocity.x + accel, maxVel);
    } else if (direction === 'left') {
      const maxVel = isSprinting ? runMaxVelocity : walkMaxVelocity;
      const accel = isSprinting ? runAcceleration : walkAcceleration;
      entity.velocity.x = Math.max(entity.velocity.y - accel, -maxVel);
    }
  }

  /**
   * Apply deceleration to entity
   * @param {Object} entity - Entity with velocity
   */
  decelerateTo(entity, targetSpeed = 0) {
    const deceleration = this.gameConfig.movement.deceleration * entity.scale;

    if (entity.velocity.x > deceleration) {
      entity.velocity.x -= deceleration;
    } else if (entity.velocity.x < -deceleration) {
      entity.velocity.x += deceleration;
    } else {
      entity.velocity.x = targetSpeed;
    }
  }

  /**
   * Apply air movement modifier (gravity multiplier based on velocity peak)
   * @param {Object} entity - Entity with velocity and grounded state
   */
  applyAirMovement(entity) {
    if (entity.touchingWall?.right || entity.touchingWall?.left) {
      return;
    }

    // Reset gravity multiplier if moving upward fast
    if (entity.velocity.y < -this.gameConfig.physics.peakVelocityThreshold * entity.scale) {
      entity.gravityMultiplier = 1;
    }
    // Fall faster and apply max fall speed
    else if (entity.velocity.y > this.gameConfig.physics.peakVelocityThreshold * entity.scale) {
      entity.gravityMultiplier = this.gameConfig.physics.gravityFallMultiplier;
      entity.velocity.y = Math.min(entity.velocity.y, this.gameConfig.physics.maxFallSpeed * entity.scale);
    }
    // Bonus air time and peak speed bonus
    else if (!entity.grounded) {
      entity.gravityMultiplier = this.gameConfig.physics.gravityPeakMultiplier;
      entity.velocity.x *= this.gameConfig.movement.peakSpeedMultiplier;
    }
  }

  /**
   * Clamp entity velocity to max fall speed
   * @param {Object} entity - Entity with velocity
   */
  clampFallSpeed(entity) {
    if (entity.velocity.y > this.gameConfig.physics.maxFallSpeed * entity.scale) {
      entity.velocity.y = this.gameConfig.physics.maxFallSpeed * entity.scale;
    }
  }

  /**
   * Set coyote time based on grounded/wall state
   * @param {Object} entity - Entity with velocity, coyoteTime, grounded, touchingWall
   * @param {number} deltaTime - Frame delta time
   */
  updateCoyoteTime(entity, deltaTime) {
    if (entity.velocity.y < 0) {
      entity.coyoteTime = 0;
    } else if (entity.grounded || entity.touchingWall?.right || entity.touchingWall?.left) {
      entity.coyoteTime = this.gameConfig.jump.coyoteTime;
    } else {
      entity.coyoteTime -= deltaTime;
    }
  }

  query(question) {
    switch (question) {
      case 'gravity':
        return this.gameConfig.physics.gravity;
      case 'maxFallSpeed':
        return this.gameConfig.physics.maxFallSpeed;
      default:
        return null;
    }
  }
}

// Create singleton instance (initialized in GameServices)
let physicsSystem;
