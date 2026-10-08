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

        this.gravity    = this.gameConfig.physics.gravity;
        this.walkMaxSpd = mov.walk.maxSpeed;
        this.walkAccel  = mov.walk.acceleration + mov.deceleration;
        this.runMaxSpd  = mov.run.maxSpeed;
        this.runAccel   = mov.run.acceleration + mov.deceleration;
        this.stopWallSlidingFrames    = jump.stopWallSlidingFrames;
        this.coyoteTime               = jump.coyoteTime;
        this.jumpBuffer               = jump.jumpBuffer;
        this.jumpSpeed                = jump.jumpSpeed;
        this.wallslideJumpSpeed       = jump.wallslideJumpSpeed;
        this.wallslideSprintJumpSpeed = jump.wallslideSprintJumpSpeed;
        this.wallslideSpeed           = jump.wallslideSpeed;
        this.wallslideSlowSpeed       = jump.wallslideSlowSpeed;
    }

    update() {}
    shutdown() {}

    processInput(entity, actions) {
        this._run(entity, actions);
        this._jump(entity, actions);
        this._wallslide(entity, actions);
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
            if (entity.wallslideFrame < this.stopWallSlidingFrames) {
                entity.wallslideFrame++;
                return;
            }
            
            entity.position.x += isMovingRight ? 1 : -1;
            entity.wallTurned = true;
            entity.wallslideFrame = 0;
            
            if (isMovingRight) entity.touchingWall.left = false;
            else entity.touchingWall.right = false;
        }

        // Apply velocity
        const isRunning = actions.run.pressed;
        const maxSpd = isRunning ? this.runMaxSpd : this.walkMaxSpd;
        const accel  = isRunning ? this.runAccel : this.walkAccel;

        if (isMovingRight) {
            entity.velocity.x = Math.min(entity.velocity.x + accel, maxSpd);
            entity.direction = "right";
        } else {
            entity.velocity.x = Math.max(entity.velocity.x - accel, -maxSpd);
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
            entity.velocity.y = -this.jumpSpeed;
            gameServices.soundSystem.play("jump");

            if ((entity.touchingWall.right || entity.touchingWall.left) && !entity.grounded) {
                entity.walljumpedFrom = entity.touchingWall.right ? 'right' : 'left';
                let horizontalSpeed = actions.run.pressed ? this.wallslideSprintJumpSpeed : this.wallslideJumpSpeed;
                entity.velocity.x = entity.touchingWall.right ? -horizontalSpeed : horizontalSpeed;
            }
        }

        // Variable Jump Height (release jump early to fall faster)
        if (!actions.jump.pressed && entity.velocity.y < 0) { 
            entity.velocity.y /= 2; 
        }
    }

    _wallslide(entity, actions) {
        if (entity.grounded || !(entity.touchingWall.right || entity.touchingWall.left)) return;
        let wallslideSpeed = actions.wallslideSlow.pressed ? this.wallslideSlowSpeed : this.wallslideSpeed;
        wallslideSpeed -= this.gravity * 60 * deltaTime;
        entity.velocity.y = Math.min(entity.velocity.y, wallslideSpeed);
        entity.direction = entity.touchingWall.right ? "left" : "right";
    }
}