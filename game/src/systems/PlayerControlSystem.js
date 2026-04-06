// PlayerControlSystem - Handles player input: horizontal movement, jumping, wall-sliding

import { deltaTime } from '../core/timing.js';
import { gameServices } from '../core/GameServices.js';

export class PlayerControlSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {}
    update() {}
    shutdown() {}

    processInput(entity, keys) {
        this._run(entity, keys);
        this._jump(entity, keys);
        this._wallSlide(entity, keys);
    }

    _run(entity, keys) {
        const cfg = this.gameConfig;
        const walkMaxVel  = cfg.movement.walk.maxVelocity * entity.scale;
        const walkAccel   = (cfg.movement.walk.acceleration + cfg.movement.deceleration) * entity.scale;
        const runMaxVel   = cfg.movement.run.maxVelocity * entity.scale;
        const runAccel    = (cfg.movement.run.acceleration + cfg.movement.deceleration) * entity.scale;

        if (keys.d.pressed && !keys.a.pressed) {
            if (!entity.grounded) {
                if (entity.touchingWall.left && entity.wallSlideFrame < cfg.jump.stopWallSlidingFrames) {
                    entity.wallSlideFrame++;
                    return;
                } else {
                    entity.wallSlideFrame = 0;
                    entity.touchingWall.left = false;
                    entity.position.x++;
                }
            }
            entity.velocity.x = !keys.shift.pressed
                ? Math.min(entity.velocity.x + walkAccel, walkMaxVel)
                : Math.min(entity.velocity.x + runAccel,  runMaxVel);
            entity.lastDirection = "right";

        } else if (!keys.d.pressed && keys.a.pressed) {
            if (!entity.grounded) {
                if (entity.touchingWall.right && entity.wallSlideFrame < cfg.jump.stopWallSlidingFrames) {
                    entity.wallSlideFrame++;
                    return;
                } else {
                    entity.wallSlideFrame = 0;
                    entity.touchingWall.right = false;
                    entity.position.x--;
                }
            }
            entity.velocity.x = !keys.shift.pressed
                ? Math.max(entity.velocity.x - walkAccel, -walkMaxVel)
                : Math.max(entity.velocity.x - runAccel,  -runMaxVel);
            entity.lastDirection = "left";
        }
    }

    _jump(entity, keys) {
        entity.jumped = false;
        entity.walljumpedFrom = null;

        if (!keys.space.previousPressed && keys.space.pressed) {
            entity.jumpBufferTime = this.gameConfig.jump.jumpBuffer;
        } else if (keys.space.pressed) {
            entity.jumpBufferTime -= deltaTime;
        }

        if (entity.jumpBufferTime > 0 && entity.coyoteTime > 0) {
            entity.jumped = true;
            entity.jumpBufferTime = 0;
            entity.velocity.y = -this.gameConfig.jump.jumpVelocity * entity.scale;
            gameServices.soundSystem.play("jump");

            if ((entity.touchingWall.right || entity.touchingWall.left) && !entity.grounded) {
                entity.walljumpedFrom = entity.touchingWall.right ? 'right' : 'left';
                let horizontalVel = this.gameConfig.jump.wallSlideJumpVelocity * entity.scale;
                if (keys.shift.pressed) {
                    horizontalVel = this.gameConfig.jump.wallSlideSprintJumpVelocity * entity.scale;
                }
                entity.velocity.x = entity.touchingWall.right ? -horizontalVel : horizontalVel;
            }
        }

        if (!keys.space.pressed && entity.velocity.y < 0) { entity.velocity.y /= 2; }
    }

    _wallSlide(entity, keys) {
        if (entity.grounded) { return; }

        let wallSlideVelocity = this.gameConfig.jump.wallSlideVelocity * entity.scale;
        if (keys.w.pressed) { wallSlideVelocity *= 0.2; }

        if (entity.touchingWall.right) {
            if (entity.velocity.y > wallSlideVelocity) { entity.velocity.y = wallSlideVelocity; }
            entity.lastDirection = "left";
        } else if (entity.touchingWall.left) {
            if (entity.velocity.y > wallSlideVelocity) { entity.velocity.y = wallSlideVelocity; }
            entity.lastDirection = "right";
        }
    }
}
