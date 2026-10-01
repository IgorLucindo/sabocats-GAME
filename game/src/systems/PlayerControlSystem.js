// PlayerControlSystem - Handles player input: horizontal movement, jumping, wall-sliding

import { deltaTime } from '../core/timing.js';
import { gameServices } from '../core/GameServices.js';

export class PlayerControlSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {
        const mov = this.gameConfig.movement;
        const jump = this.gameConfig.jump;

        this.walkMaxVel = mov.walk.maxVelocity;
        this.walkAccel  = mov.walk.acceleration + mov.deceleration;
        this.runMaxVel  = mov.run.maxVelocity;
        this.runAccel   = mov.run.acceleration + mov.deceleration;
        this.stopWallSlidingFrames       = jump.stopWallSlidingFrames;
        this.coyoteTime                  = jump.coyoteTime;
        this.jumpBuffer                  = jump.jumpBuffer;
        this.jumpVelocity                = jump.jumpVelocity;
        this.wallSlideJumpVelocity       = jump.wallSlideJumpVelocity;
        this.wallSlideSprintJumpVelocity = jump.wallSlideSprintJumpVelocity;
        this.wallSlideVelocity           = jump.wallSlideVelocity;
    }

    update() {}
    shutdown() {}

    processInput(entity, actions) {
        this._run(entity, actions);
        this._jump(entity, actions);
        this._wallSlide(entity, actions);
    }

    _run(entity, actions) {
        entity.wallTurned = false;
        const right = actions.moveRight.pressed;
        const left = actions.moveLeft.pressed;

        // Bail out early if opposing keys or no keys are pressed
        if (right === left) return;

        const isMovingRight = right;
        const activeWall = isMovingRight ? entity.touchingWall.left : entity.touchingWall.right;

        // Handle Wall Push-off
        if (!entity.grounded && activeWall) {
            if (entity.wallSlideFrame < this.stopWallSlidingFrames) {
                entity.wallSlideFrame++;
                return;
            }
            
            entity.position.x += isMovingRight ? 1 : -1;
            entity.wallTurned = true;
            entity.wallSlideFrame = 0;
            
            if (isMovingRight) entity.touchingWall.left = false;
            else entity.touchingWall.right = false;
        }

        // Apply Velocity
        const isRunning = actions.run.pressed;
        const maxVel = isRunning ? this.runMaxVel : this.walkMaxVel;
        const accel  = isRunning ? this.runAccel : this.walkAccel;

        if (isMovingRight) {
            entity.velocity.x = Math.min(entity.velocity.x + accel, maxVel);
            entity.direction = "right";
        } else {
            entity.velocity.x = Math.max(entity.velocity.x - accel, -maxVel);
            entity.direction = "left";
        }
    }

    _jump(entity, actions) {
        entity.jumped = false;
        entity.walljumpedFrom = null;

        // Coyote time
        if (entity.velocity.y < 0) { 
            entity.coyoteTime = 0; 
        } else if (entity.grounded || entity.touchingWall.right || entity.touchingWall.left) {
            entity.coyoteTime = this.coyoteTime;
        } else {
            entity.coyoteTime -= deltaTime;
        }

        // Jump Buffer
        if (!actions.jump.previousPressed && actions.jump.pressed) {
            entity.jumpBufferTime = this.jumpBuffer;
        } else if (actions.jump.pressed) {
            entity.jumpBufferTime -= deltaTime;
        }

        // Execute Jump
        if (entity.jumpBufferTime > 0 && entity.coyoteTime > 0) {
            entity.jumped = true;
            entity.jumpBufferTime = 0;
            entity.velocity.y = -this.jumpVelocity;
            gameServices.soundSystem.play("jump");

            if ((entity.touchingWall.right || entity.touchingWall.left) && !entity.grounded) {
                entity.walljumpedFrom = entity.touchingWall.right ? 'right' : 'left';
                let horizontalVel = actions.run.pressed ? this.wallSlideSprintJumpVelocity : this.wallSlideJumpVelocity;
                entity.velocity.x = entity.touchingWall.right ? -horizontalVel : horizontalVel;
            }
        }

        // Variable Jump Height (release jump early to fall faster)
        if (!actions.jump.pressed && entity.velocity.y < 0) { 
            entity.velocity.y /= 2; 
        }
    }

    _wallSlide(entity, actions) {
        if (entity.grounded) return;

        let currentWallSlideVelocity = this.wallSlideVelocity;
        if (actions.lookUp.pressed) currentWallSlideVelocity *= 0.2;

        if (entity.touchingWall.right) {
            if (entity.velocity.y > currentWallSlideVelocity) { 
                entity.velocity.y = currentWallSlideVelocity; 
            }
            entity.direction = "left";
        } else if (entity.touchingWall.left) {
            if (entity.velocity.y > currentWallSlideVelocity) { 
                entity.velocity.y = currentWallSlideVelocity; 
            }
            entity.direction = "right";
        }
    }
}