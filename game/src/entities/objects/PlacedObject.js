import { ctx } from '../../core/RenderContext.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { collision, syncedRandom } from '../../helpers.js';
import { AnimatedSprite } from '../AnimatedSprite.js';

// PlacedObject - A game object that has been placed in the world
// Handles collisions, animations and gameplay logic; behavior specific to one object comes from the hooks of its data file
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
        hooks,
        attachment,
        spriteOffset,
        animations,
        crateIndex,
        objectId,
        placementId
    }) {
        super({position, texture});
        this.crateIndex = crateIndex;
        this.objectId = objectId;
        this.placementId = placementId;
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
        this.hooks = hooks;
        
        this.attachment = attachment;
        if (this.attachment) {
            this.attachment.mainObject = this;
            this.attachment.rotation = rotation;
        }
        
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
        
        this.hooks.onPlace?.(gameServices, this);
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
            type: this.hitbox.damage,
            owner: this
        };
        
        if (!this.explosion) {
            if (this.hitbox.damage) {
                this.damageBlock = gameServices.collisionSystem.createDamageBlock(blockConfig);
            } else {
                this.collisionBlock = gameServices.collisionSystem.createBlock(blockConfig);
            }
        }
        
        if (this.attachment) {
            const attachmentConfig = { ...this.attachment.hitbox, type: this.attachment.hitbox.damage };
            this.attachment.damageBlock = gameServices.collisionSystem.createDamageBlock(attachmentConfig);
        }
    }
    
    // Update object each frame
    update() {
        if (this.attachment) { this.attachment.update(); }
        if (this._currentKey === "animated") { this.updateFrames(); }
        if (this.animations.idle) { this._tickIdle(); }
        this.hooks.onUpdate?.(gameServices, this);
    }

    // A player died on this object's damage block
    onDamage(player, side) {
        this.hooks.onDamage?.(gameServices, this, player, side);
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
    
    // Destroy every other object overlapping rect and tell the server which placements were removed
    destroyObjectsInRect(rect) {
        const removedPlacementIds = new Set();
        for (let i = gameServices.matchObjects.length - 1; i >= 0; i--) {
            const object = gameServices.matchObjects[i];
            if (object === this) { continue; }
            const objectRect = {
                position: {
                    x: object.position.x + object.hitbox.position.x,
                    y: object.position.y + object.hitbox.position.y
                },
                width: object.hitbox.width,
                height: object.hitbox.height
            };
            if (!collision({ object1: rect, object2: objectRect })) { continue; }
            if (object.placementId && !object.explosion) {
                removedPlacementIds.add(object.placementId);
            }
            object.destroy();
        }
        if (removedPlacementIds.size || this.explosion) {
            gameServices.socketHandler.sendRemovePlacedObjects({
                removedPlacementIds: [...removedPlacementIds],
                explodedPlacementId: this.explosion ? this.placementId : undefined
            });
        }
    }

    // Deterministic [0,1) roll shared by every client for this object; salt keeps rolls independent
    syncedRoll(salt) {
        return syncedRandom(gameState.get('match.seed') + salt + (this.crateIndex ?? 0));
    }

    // Use seeded random so all clients generate the same idle interval for the same object
    _randomIdleInterval() {
        const { minInterval, maxInterval } = this.animations.idle;
        return minInterval + Math.floor(this.syncedRoll(1000) * (maxInterval - minInterval + 1));
    }

    // Called when idle animation ends: the object's own hook decides what happens next, otherwise idle loops
    _onIdleEnd() {
        if (this.hooks.onIdleEnd) { this.hooks.onIdleEnd(gameServices, this); }
        else { super._onIdleEnd(); }
    }
}
