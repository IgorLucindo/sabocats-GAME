// PhysicsSystem - Handles velocity integration, gravity, and deceleration for physics entities

import { deltaTime } from '../core/timing.js';

export class PhysicsSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {}
    update() {}
    shutdown() {}

    applyHorizontalVelocity(entity) {
        const tickrateCorrection = 60 * deltaTime;
        entity.position.x += Math.round(entity.velocity.x / entity.scale) * entity.scale * tickrateCorrection;
    }

    applyVerticalVelocity(entity) {
        const tickrateCorrection = 60 * deltaTime;
        entity.velocity.y += this.gameConfig.physics.gravity * entity.gravityMultiplier * tickrateCorrection * entity.scale;
        entity.position.y += entity.velocity.y * tickrateCorrection;
    }

    // Gravity multiplier, max fall speed, peak speed boost
    applyAirMovement(entity) {
        if (entity.touchingWall.right || entity.touchingWall.left) { return; }

        const peakThreshold = this.gameConfig.physics.peakVelocityThreshold * entity.scale;
        if (entity.velocity.y < -peakThreshold) {
            entity.gravityMultiplier = 1;
        } else if (entity.velocity.y > peakThreshold) {
            entity.gravityMultiplier = this.gameConfig.physics.gravityFallMultiplier;
            entity.velocity.y = Math.min(entity.velocity.y, this.gameConfig.physics.maxFallSpeed * entity.scale);
        } else if (!entity.grounded) {
            entity.gravityMultiplier = this.gameConfig.physics.gravityPeakMultiplier;
            entity.velocity.x *= this.gameConfig.movement.peakSpeedMultiplier;
        }
    }

    decelerate(entity) {
        const deceleration = this.gameConfig.movement.deceleration * entity.scale;
        if (entity.velocity.x > deceleration)       { entity.velocity.x -= deceleration; }
        else if (entity.velocity.x < -deceleration) { entity.velocity.x += deceleration; }
        else                                         { entity.velocity.x = 0; }
    }
}
