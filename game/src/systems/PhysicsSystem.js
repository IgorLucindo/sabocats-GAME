// PhysicsSystem - Handles velocity integration, gravity, and deceleration for physics entities

import { deltaTime } from '../core/timing.js';

export class PhysicsSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {
        const phys = this.gameConfig.physics;
        const mov  = this.gameConfig.movement;
        
        this.gravity = phys.gravity;
        this.maxFallSpeed = phys.maxFallSpeed;
        this.peakSpeedThreshold = phys.peakSpeedThreshold;
        this.gravityFallMultiplier = phys.gravityFallMultiplier;
        this.gravityPeakMultiplier = phys.gravityPeakMultiplier;
        this.decelerationAmount = mov.deceleration;
    }

    update() {}
    shutdown() {}

    // Stop an entity in place, for deaths that should remain attached to their hazard.
    freezePosition(entity) {
        entity.physicsFrozen = true;
        entity.velocity.x = 0;
        entity.velocity.y = 0;
    }

    // Entities with physicsFrozen set (e.g. impaled corpses) are not moved.
    applyHorizontalVelocity(entity) {
        if (entity.physicsFrozen) return;
        const tickrateCorrection = 60 * deltaTime;
        entity.position.x += entity.velocity.x * tickrateCorrection;
    }

    applyVerticalVelocity(entity) {
        if (entity.physicsFrozen) return;
        const tickrateCorrection = 60 * deltaTime;
        entity.velocity.y += this.gravity * entity.gravityMultiplier * tickrateCorrection;
        entity.position.y += entity.velocity.y * tickrateCorrection;
    }

    applyAirMovement(entity) {
        if (entity.touchingWall.right || entity.touchingWall.left) return;
        const peakThreshold = this.peakSpeedThreshold;
        if (entity.velocity.y < -peakThreshold) {
            entity.gravityMultiplier = 1;
        } else if (entity.velocity.y > peakThreshold) {
            entity.gravityMultiplier = this.gravityFallMultiplier;
            entity.velocity.y = Math.min(entity.velocity.y, this.maxFallSpeed);
        } else if (!entity.grounded) {
            entity.gravityMultiplier = this.gravityPeakMultiplier;
        }
    }

    decelerate(entity) {
        const deceleration = this.decelerationAmount;

        if (entity.velocity.x > deceleration)       { entity.velocity.x -= deceleration; }
        else if (entity.velocity.x < -deceleration) { entity.velocity.x += deceleration; }
        else                                        { entity.velocity.x = 0; }
    }
}
