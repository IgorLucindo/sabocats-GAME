// AnimationSystem - Handles sprite state machine and particle emission for animated entities

export class AnimationSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {}
    update() {}
    shutdown() {}

    updateSprite(entity) {
        const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;
        const peakThreshold   = this.gameConfig.physics.peakVelocityThreshold * entity.scale;

        if (entity.grounded) {
            if (entity.velocity.x > 0) {
                entity.switchSprite(entity.velocity.x <= walkMaxVelocity ? "walk" : "run");
            } else if (entity.velocity.x < 0) {
                entity.switchSprite(entity.velocity.x >= -walkMaxVelocity ? "walkLeft" : "runLeft");
            } else {
                if (entity.lastSprite.substring(0, 4) !== "idle") { entity.idleFrame = 0; }
                else if (entity.currentFrame === entity.frameRate - 1 &&
                         entity.elapsedFrames % entity.frameBuffer === 0) {
                    entity.idleFrame++;
                }

                if (entity.lastDirection === "right") {
                    if (entity.idleFrame < 3)      { entity.switchSprite("idleStand"); }
                    else if (entity.idleFrame < 4) { entity.switchSprite("idleSitting"); }
                    else                           { entity.switchSprite("idleSit"); }
                } else {
                    if (entity.idleFrame < 3)      { entity.switchSprite("idleStandLeft"); }
                    else if (entity.idleFrame < 4) { entity.switchSprite("idleSittingLeft"); }
                    else                           { entity.switchSprite("idleSitLeft"); }
                }
            }
        } else {
            if (entity.touchingWall.right)     { entity.switchSprite("wallSlide"); }
            else if (entity.touchingWall.left) { entity.switchSprite("wallSlideLeft"); }
            else {
                if (entity.velocity.y < -peakThreshold) {
                    entity.switchSprite(entity.lastDirection === "right" ? "jump" : "jumpLeft");
                } else if (entity.velocity.y > peakThreshold) {
                    entity.switchSprite(entity.lastDirection === "right" ? "fall" : "fallLeft");
                } else {
                    entity.switchSprite(entity.lastDirection === "right" ? "float" : "floatLeft");
                }
            }
        }
    }

    updateParticles(entity, keys, particleSystem) {
        const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;

        if (entity.grounded) {
            if (entity.velocity.x < -walkMaxVelocity * 0.4 && keys.d.pressed && !keys.d.previousPressed) {
                particleSystem.add("turn", entity);
            } else if (entity.velocity.x > walkMaxVelocity * 0.4 && keys.a.pressed && !keys.a.previousPressed) {
                particleSystem.add("turnLeft", entity);
            }
        } else if (entity.jumped) {
            if (entity.touchingWall.right)     { particleSystem.add("wallSlideJump", entity); }
            else if (entity.touchingWall.left) { particleSystem.add("wallSlideJumpLeft", entity); }
            else                               { particleSystem.add("jump", entity); }
        }

        if (!entity.previousGrounded && entity.grounded &&
            entity.previousVelocity.y > this.gameConfig.physics.maxFallSpeed * entity.scale * 0.7) {
            particleSystem.add("fall", entity);
        }
    }
}
