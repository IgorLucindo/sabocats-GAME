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

        if (entity.grounded) {
            entity.flipped = entity.lastDirection === 'right';

            if (entity.velocity.x > 0) {
                entity.switchSprite(entity.velocity.x <= walkMaxVelocity ? "walk" : "run");
            } else if (entity.velocity.x < 0) {
                entity.switchSprite(entity.velocity.x >= -walkMaxVelocity ? "walk" : "run");
            } else {
                if (entity.lastSprite.substring(0, 4) !== "idle" &&
                    entity.lastSprite !== "sit" && entity.lastSprite !== "sitting") {
                    entity.idleFrame = 0;
                } else if (entity.currentFrame === entity.frameRate - 1 &&
                           entity.elapsedFrames % entity.frameBuffer === 0) {
                    entity.idleFrame++;
                }

                if (entity.idleFrame < 4)      { entity.switchSprite("idle"); }
                else if (entity.idleFrame < 5) { entity.switchSprite("sitting"); }
                else                           { entity.switchSprite("sit"); }
            }
        } else {
            if (entity.touchingWall.right) {
                entity.flipped = true;   // canonical faces left, flip to face right wall
                entity.switchSprite("wallslide");
            } else if (entity.touchingWall.left) {
                entity.flipped = false;  // canonical faces left, no flip needed
                entity.switchSprite("wallslide");
            } else {
                entity.flipped = entity.lastDirection === 'right';
                
                const jumpFrameVelocityScale = 3.5;
                const minVy = -this.gameConfig.jump.jumpVelocity * entity.scale;
                const maxVy = this.gameConfig.physics.maxFallSpeed * entity.scale;
                const t = (entity.velocity.y * jumpFrameVelocityScale - minVy) / (maxVy - minVy);
                const jumpFrame = Math.max(1, Math.min(7, Math.round(t * 6) + 1));
                entity.switchSprite("jump" + jumpFrame);
            }
        }
    }

    updateParticles(entity, keys, particleSystem) {
        const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;

        if (entity.grounded) {
            if (entity.velocity.x < -walkMaxVelocity * 0.4 && keys.d.pressed && !keys.d.previousPressed) {
                particleSystem.add("turnDust", entity, { flipped: false });
            } else if (entity.velocity.x > walkMaxVelocity * 0.4 && keys.a.pressed && !keys.a.previousPressed) {
                particleSystem.add("turnDust", entity, { flipped: true });
            }
        } else if (entity.jumped) {
            const rotation = entity.walljumpedFrom === 'left' ? 90 : entity.walljumpedFrom === 'right' ? -90 : 0;
            particleSystem.add("jumpDust", entity, rotation ? { rotation } : {});
        }

        if (!entity.previousGrounded && entity.grounded &&
            entity.previousVelocity.y > this.gameConfig.physics.maxFallSpeed * entity.scale * 0.7) {
            particleSystem.add("landDust", entity);
        }
    }
}
