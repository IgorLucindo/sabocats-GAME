// AnimationSystem - Handles sprite state machine and particle emission for animated entities

import { gameServices } from '../core/GameServices.js';

export class AnimationSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {}
    update() {}
    shutdown() {}

    updateSprite(entity) {
        if (entity.finished && !entity.dead) {
            entity.switchSprite('celebrate');
            return;
        }

        if (!entity.interrupted) { entity.flipped = entity.direction === 'right'; }

        if (entity.grounded) {
            this._groundedSprite(entity);
        } else {
            entity.cancelInterrupt();
            this._airSprite(entity);
        }
    }

    _groundedSprite(entity) {
        if (entity.turned) {
            const startFrame = entity.interrupted ? entity.frameRate - 1 - entity.currentFrame : 0;
            entity.flipped = entity.direction === 'left';
            entity.playInterrupt('turn', startFrame);
        }
        if (entity.interrupted) { return; }
        const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;
        if (entity.velocity.x > 0) {
            entity.switchSprite(entity.velocity.x <= walkMaxVelocity ? "walk" : "run");
        } else if (entity.velocity.x < 0) {
            entity.switchSprite(entity.velocity.x >= -walkMaxVelocity ? "walk" : "run");
        } else {
            this._idleSprite(entity);
        }
    }

    _idleSprite(entity) {
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

    _airSprite(entity) {
        if (entity.touchingWall.right || entity.touchingWall.left) {
            this._wallslideSprite(entity);
        } else {
            this._jumpSprite(entity);
        }
    }

    _wallslideSprite(entity) {
        entity.flipped = entity.touchingWall.right;
        entity.switchSprite("wallslide");
    }

    _jumpSprite(entity) {
        const jumpFrameVelocityScale = 3;
        const minVy = -this.gameConfig.jump.jumpVelocity * entity.scale;
        const maxVy = this.gameConfig.physics.maxFallSpeed * entity.scale;
        const t = (entity.velocity.y * jumpFrameVelocityScale - minVy) / (maxVy - minVy);
        const jumpFrame = Math.max(1, Math.min(7, Math.round(t * 6) + 1));
        entity.switchSprite("jump" + jumpFrame);
    }

    updateParticles(entity, particleSystem) {
        const walkMaxVelocity = this.gameConfig.movement.walk.maxVelocity * entity.scale;

        let name    = null;
        let options = {};

        if (entity.grounded) {
            if (entity.turned && Math.abs(entity.velocity.x) >= 0.5 * walkMaxVelocity) {
                name = "turnDust"; options = { flipped: entity.direction === 'left' };
            }
        } else if (entity.jumped) {
            name = "jumpDust";
            const rotation = entity.walljumpedFrom === 'left' ? 90 : entity.walljumpedFrom === 'right' ? -90 : 0;
            if (rotation) { options = { rotation }; }
        }

        if (name) { particleSystem.add(name, entity.position, { ...options, broadcast: true }); }

        if (!entity.previousGrounded && entity.grounded &&
            entity.previousVelocity.y > this.gameConfig.physics.maxFallSpeed * entity.scale * 0.7) {
            particleSystem.add("landDust", entity.position, { broadcast: true });
            gameServices.soundSystem.play("land");
        }
    }
}
