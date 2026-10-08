// AnimationSystem - Handles sprite state machine and particle emission for animated entities

import { gameServices } from '../core/GameServices.js';

// Impaled resting pose for the side a hazard points at (left and right share the side sprite),
// and the transition sprite that plays into it
const IMPALED_POSES = { up: 'idle', down: 'down', left: 'side', right: 'side' };
const IMPALED_TRANSITIONS = { idle: 'dyingIdle', down: 'dyingDown', side: 'dyingSide' };

export class AnimationSystem {
    constructor({ gameConfig }) {
        this.gameConfig = gameConfig;
    }

    initialize() {
        this.walkMaxSpeed = this.gameConfig.movement.walk.maxSpeed;
        this.maxFallSpeed = this.gameConfig.physics.maxFallSpeed;
        this.wallslideSlowSpeed = this.gameConfig.jump.wallslideSlowSpeed;
    }

    update() {}
    shutdown() {}

    // Pose a corpse on the hazard that impaled it: settle on the resting pose, then play the transition
    // into it (an interrupt returns to the sprite that was active when it started).
    // The side sprite is mirrored to face the hazard.
    setImpaledPose(entity, side) {
        const pose = IMPALED_POSES[side];
        if (pose === 'side') { entity.flipped = side === 'left'; }
        entity.cancelInterrupt();
        entity.switchSprite(pose);
        entity.playInterrupt(IMPALED_TRANSITIONS[pose]);
    }

    updatePlayer(entity) {
        if (entity.physicsFrozen) return;
        if (entity.finished && !entity.dead) {
            entity.switchSprite('celebrate');
            return;
        }
        if (!entity.interrupted) { entity.flipped = entity.direction === 'right'; }
        if (entity.grounded) {
            this._groundedSprite(entity);
        } else {
            this._airSprite(entity);
        }
    }

    _groundedSprite(entity) {
        if (entity.turned) {
            const startFrame = entity.interrupted ? entity.frames - 1 - entity.currentFrame : 0;
            entity.flipped = entity.direction === 'left';
            entity.playInterrupt('turn', startFrame);
        }
        if (entity.interrupted) {
            entity.idleFrame = 0;
            return;
        }
        if (entity.velocity.x > 0) {
            entity.switchSprite(entity.velocity.x <= this.walkMaxSpeed ? "walk" : "run");
        } else if (entity.velocity.x < 0) {
            entity.switchSprite(entity.velocity.x >= -this.walkMaxSpeed ? "walk" : "run");
        } else {
            this._idleSprite(entity);
        }
    }

    _idleSprite(entity) {
        const idleSprites = new Set(["idle", "sit", "sitting"]);
        if (!idleSprites.has(entity.lastSprite)) {
            entity.idleFrame = 0;
        } else if (entity.currentFrame === entity.frames - 1 &&
                   entity.elapsedFrames % entity.frameBuffer === 0) {
            entity.idleFrame++;
        }
        const idleFrames = this.gameConfig.player.idleFrames;
        if (entity.idleFrame < idleFrames) { entity.switchSprite("idle"); }
        else if (entity.idleFrame < idleFrames + 1) { entity.switchSprite("sitting"); }
        else { entity.switchSprite("sit"); }
    }

    _airSprite(entity) {
        if (entity.touchingWall.right || entity.touchingWall.left) {
            this._wallslideSprite(entity);
            return;
        }
        // Pushed off a wall this frame: snap to the air pose first so the turn
        // interrupt auto-reverts back to it, then play the wall-turn.
        if (entity.wallTurned && !entity.interrupted) {
            entity.cancelInterrupt();
            this._setAirSprite(entity);
            entity.playInterrupt("turnWall");
            return;
        }
        // Let a freshly started wall-turn play out; any other interrupt is
        // cancelled by switching to the air pose (e.g. a ground turn cut short
        // by walking off a ledge).
        if (entity.interrupted && entity.lastSprite === "turnWall") return;
        entity.cancelInterrupt();
        this._setAirSprite(entity);
    }

    _setAirSprite(entity) {
        // Clamp to ±20% of max speed — full 7-frame range plays through near the apex
        const halfRange = this.maxFallSpeed * 0.3;
        const raw = Math.max(-1, Math.min(1, entity.velocity.y / halfRange));
        const airFrame = Math.max(1, Math.min(8, Math.round((raw + 1) / 2 * 7) + 1));
        entity.switchSprite("air" + airFrame);
    }

    // Play the wall-hit turn animation right after attaching to the wall
    // Then play wallslide animation
    _wallslideSprite(entity) {
        entity.flipped = entity.touchingWall.right;
        if (entity.interrupted) return;
        const slowWallslide = entity.velocity.y <= this.wallslideSlowSpeed * 1.1;
        const wallslideSprite = slowWallslide ? "wallslide2" : "wallslide1";
        const wasWallsliding = entity.lastSprite === "wallslide1" ||
            entity.lastSprite === "wallslide2";
        entity.switchSprite(wallslideSprite);
        if (!wasWallsliding) entity.playInterrupt("wallHit");
    }

    // Switch all placed objects (and their attachments) to the given sprite key.
    // switchSprite is a no-op when the key is null, so objects stay on their current sprite.
    updatePlacedObjects(key) {
        for (const obj of gameServices.matchObjects) {
            obj.switchSprite(key);
            obj.attachment?.switchSprite(key);
        }
    }

    updateParticles(entity, particleSystem) {
        let name    = null;
        let options = {};
        if (entity.grounded) {
            if (entity.turned && Math.abs(entity.velocity.x) >= 0.5 * this.walkMaxSpeed) {
                name = "turnDust"; options = { flipped: entity.direction === 'left' };
            }
        } else if (entity.jumped) {
            name = "jumpDust";
            const rotation = entity.walljumpedFrom === 'left' ? 90 : entity.walljumpedFrom === 'right' ? -90 : 0;
            if (rotation) { options = { rotation }; }
        }
        if (name) { particleSystem.add(name, entity.position, { ...options, broadcast: true }); }
        if (!entity.previousGrounded && entity.grounded &&
            entity.previousVelocity.y > this.maxFallSpeed * 0.7) {
            particleSystem.add("landDust", entity.position, { broadcast: true });
            gameServices.soundSystem.play("land");
        }
    }
}
