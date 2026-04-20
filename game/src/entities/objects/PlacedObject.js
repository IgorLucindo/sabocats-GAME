import { ctx } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { collision, rotate90deg, syncedRandom } from '../../helpers.js';
import { AnimatedSprite } from '../AnimatedSprite.js';

// PlacedObject - A game object that has been placed in the world
// Handles collisions, animations, explosions, and gameplay logic
export class PlacedObject extends AnimatedSprite {
    constructor({
        position,
        texture,
        width,
        height,
        hitbox,
        rotation,
        rotationCenter,
        needSupport,
        explosion,
        attachment,
        spriteOffset,
        animations,
        crateIndex
    }) {
        super({position, texture});
        this.crateIndex = crateIndex;
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.rotation = rotation;
        this.rotationCenter = rotationCenter;
        this.spriteOffset = spriteOffset || {x: 0, y: 0};
        
        this.collisionBlock = undefined;
        this.damageBlock = undefined;
        this.needSupport = needSupport;
        this.explosion = explosion;
        this._failTimer = null;
        this.pendingExplosion = false;
        
        this.attachment = attachment;
        
        // Use existing animation images from PlaceableObject (don't reload)
        if (animations) {
            this.animations = animations;
            // Set main sprite to default animation's image (already loaded)
            if (animations.default && animations.default.image) {
                this.image = animations.default.image;
                this.imageLoaded = true;
            }
        }
        this._initIdle();
        
        // Register in world
        gameServices.matchObjects.push(this);
        this._createCollisionBlocks();
        
        if (this.explosion) {
            this.pendingExplosion = true;
            gameServices.soundSystem.play('fuse');
        }
    }
    
    // Create collision/damage blocks for this object
    _createCollisionBlocks() {
        const blockConfig = {
            position: {
                x: this.position.x + this.hitbox.position.x,
                y: this.position.y + this.hitbox.position.y
            },
            width: this.hitbox.width,
            height: this.hitbox.height,
        };
        
        if (!this.explosion) {
            if (this.hitbox.damage) {
                this.damageBlock = gameServices.collisionSystem.createDamageBlock(blockConfig);
            } else {
                this.collisionBlock = gameServices.collisionSystem.createBlock(blockConfig);
            }
        }
        
        if (this.attachment) {
            this.attachment.damageBlock = gameServices.collisionSystem.createDamageBlock(this.attachment.hitbox);
        }
    }
    
    // Update object each frame
    update() {
        if (this.attachment) { this.attachment.update(); }
        if (this.animations?.idle && this._failTimer === null) { this._tickIdle(); }
        if (this._failTimer !== null) { this._failTick(); }
    }
    
    // Render object
    render() {
        ctx.save();
        if (this.attachment) { this.attachment.render(); }
        ctx.translate(this.spriteOffset.x, this.spriteOffset.y);
        
        if (!this.rotation) { this.draw(); }
        else { this.drawRotated(this.rotation, this.rotationCenter); }
        ctx.restore();
    }
    
    // Destroy this object: remove from matchObjects and unregister its collision blocks
    destroy() {
        const idx = gameServices.matchObjects.indexOf(this);
        if (idx !== -1) { gameServices.matchObjects.splice(idx, 1); }
        
        if (this.collisionBlock) {
            gameServices.collisionSystem.removeBlock(this.collisionBlock);
            this.collisionBlock = undefined;
        }
        
        if (this.damageBlock) {
            gameServices.collisionSystem.removeDamageBlock(this.damageBlock);
            this.damageBlock = undefined;
        }
        
        if (this.attachment?.damageBlock) {
            gameServices.collisionSystem.removeDamageBlock(this.attachment.damageBlock);
            this.attachment.damageBlock = undefined;
        }
    }
    
    // ===== EXPLOSION LOGIC =====
    
    // Explode: destroy all overlapping objects, play explosion particle, destroy self
    _explode() {
        const tileSize = GameConfig.rendering.tileSize;
        const dynamiteRect = {
            position: {
                x: this.position.x + this.hitbox.position.x,
                y: this.position.y + this.hitbox.position.y
            },
            width: this.hitbox.width,
            height: this.hitbox.height
        };
        
        for (let i = gameServices.matchObjects.length - 1; i >= 0; i--) {
            const obj = gameServices.matchObjects[i];
            if (obj === this) { continue; }
            const objRect = {
                position: {
                    x: obj.position.x + obj.hitbox.position.x,
                    y: obj.position.y + obj.hitbox.position.y
                },
                width: obj.hitbox.width,
                height: obj.hitbox.height
            };
            if (collision({object1: dynamiteRect, object2: objRect})) { obj.destroy(); }
        }
        
        gameServices.particleSystem.add("explosion", this.position);
        gameServices.soundSystem.play("explosion");
        gameServices.cameraSystem.shake(25, 5);
        this.destroy();
        gameServices.matchStateMachine.flushPendingState();
    }
    
    // Use seeded random so all clients generate the same idle interval for the same object
    _randomIdleInterval() {
        const { minInterval, maxInterval } = this.animations.idle;
        const seed = gameState.get('match.seed');
        const rng = syncedRandom(seed + 1000 + (this.crateIndex ?? 0));
        return minInterval + Math.floor(rng * (maxInterval - minInterval + 1));
    }
    
    // Called when idle animation ends — trigger explosion or loop idle (for non-explosive objects)
    _onIdleEnd() {
        if (this.explosion) {
            this._triggerExplosion();
        } else {
            super._onIdleEnd();
        }
    }
    
    // Randomly choose normal or fail explosion (seeded so all clients agree)
    _triggerExplosion() {
        const seed = gameState.get('match.seed');
        const rng = syncedRandom(seed + 10000 + (this.crateIndex ?? 0));
        
        if (this.explosion.failChance > 0 && rng < this.explosion.failChance) {
            this._startFail();
        } else {
            this._explode();
        }
    }
    
    // Start fail sequence: play sound, focus camera on dynamite, start countdown
    _startFail() {
        this.switchSprite('fail');
        gameServices.soundSystem.play('fail');
        gameServices.cameraSystem.focusOn({
            position: this.position,
            width: this.width,
            height: this.height,
            zoom: this.explosion.failZoom
        });
        this._failTimer = this.explosion.failDelay;
    }
    
    // Countdown until fail explosion fires
    _failTick() {
        if (--this._failTimer <= 0) {
            this._failTimer = null;
            this._explodeFail();
        }
    }
    
    // Fail explosion: 5x3 tile area, stronger shake, restore camera
    _explodeFail() {
        const ts = GameConfig.rendering.tileSize;
        const { width: fW, height: fH } = this.explosion.failRadius;
        const cx = this.position.x + this.hitbox.position.x + this.hitbox.width / 2;
        const cy = this.position.y + this.hitbox.position.y + this.hitbox.height / 2;
        const bigRect = {
            position: { x: cx - (fW * ts) / 2, y: cy - (fH * ts) / 2 },
            width: fW * ts,
            height: fH * ts
        };
        
        for (let i = gameServices.matchObjects.length - 1; i >= 0; i--) {
            const obj = gameServices.matchObjects[i];
            if (obj === this) { continue; }
            const objRect = {
                position: {
                    x: obj.position.x + obj.hitbox.position.x,
                    y: obj.position.y + obj.hitbox.position.y
                },
                width: obj.hitbox.width,
                height: obj.hitbox.height
            };
            if (collision({object1: bigRect, object2: objRect})) { obj.destroy(); }
        }
        
        gameServices.particleSystem.add("explosion", this.position);
        gameServices.soundSystem.play("explosion");
        gameServices.cameraSystem.shake(35, 10);
        gameServices.cameraSystem.clearFollowTarget();
        gameServices.cameraSystem.setZoom(GameConfig.camera.maxZoom);
        this.destroy();
        gameServices.matchStateMachine.flushPendingState();
    }
}
