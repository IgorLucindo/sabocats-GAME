import { ctx } from '../../core/RenderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { collision, rotate90deg, syncedRandom } from '../../helpers.js';
import { AnimatedSprite } from '../AnimatedSprite.js';
import { PlacedObject } from './PlacedObject.js';

// PlaceableObject - A game object in the crate that can be selected and placed
// Handles UI interaction: choosing, dragging, rotation preview, placement validation
export class PlaceableObject extends AnimatedSprite {
    constructor({position, texture, width, height, hitbox, rotatable, needSupport, explosion, compositeObject, objectAttachmentId, spriteOffset, animations, type}) {
        super({position, texture});
        this.crateIndex = undefined;
        this.type = type; // Type: "default", "explosive", "random"
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.main = true;
        this.spriteOffset = spriteOffset || {x: 0, y: 0};

        this.chose = false;
        this.placed = false;
        this.previousPlaced = false;
        this.placeable = false;
        this.highlighted = false;

        this.rotatable = rotatable;
        this.rotation = 0;
        this.previousRotation = 0;
        this.rotationCenter = {x: 0, y: 0};

        this.needSupport = needSupport;
        this.explosion = explosion;

        this.compositeObjects = [];
        for (let i = 0; i < compositeObject.number; i++) {
            const compositeObjectTemp = gameServices.entityFactory.createPlaceableObject(compositeObject.id);
            compositeObjectTemp.main = false;
            this.compositeObjects.push(compositeObjectTemp);
        }

        if (objectAttachmentId) {
            this.attachment = gameServices.entityFactory.createObjectAttachment(objectAttachmentId, this);
        }

        // Named animations (optional) — loads image objects for each entry
        if (animations) {
            this.animations = animations;
            for (const key in animations) {
                if (!animations[key]) { continue; }
                const img = new Image();
                img.src = animations[key].texture;
                animations[key].image = img;
            }
        }
        this._initIdle();
    }



    // Update object (only attachment in crate)
    update() {
        if (this.attachment) { this.attachment.update(); }
    }

    // Update object in choosing state
    updateInChoosing() {
        if (this.chose) { return; }

        if (!gameServices.user.placeableObject.chose) {
            this.mouseOverScreen({object: this, func: () => { this.choose(); }});
        }
        this.update();
    }

    // Update object in placing state
    updateInPlacing() {
        if (!this.chose) { return; }

        if (!this.placed && this.crateIndex == gameServices.user.placeableObject.crateIndex) {
            this.followObject({object: gameServices.cursorSystem, func: () => {
                this.updateRotationCenter();
                this.updateCompositeObjects();
                this.checkPlaceable();
            }});
            this.rotateControl();
            this.placeControl();
        }
        this.updateRotationCenter();
        this.updateCompositeObjects();
        this.checkRotation();
        this.checkPlacement();
        if (!this.placed) { this.update(); }
    }



    // render object
    render() {
        ctx.save();
        if (this.attachment) { this.attachment.render(); }
        ctx.translate(this.spriteOffset.x, this.spriteOffset.y);

        if (!this.rotation) { this.draw(); }
        else { this.drawRotated(this.rotation, this.rotationCenter); }
        ctx.restore();
    }

    // render object in choosing state
    renderInChoosing() {
        if (this.chose) { return; }

        ctx.save();
        this.renderHighlight();
        this.render();
        ctx.restore();
    }

    // render object in placing state
    renderInPlacing() {
        if (!this.chose || this.placed) { return; }

        this.render();
    }



    // update rotation center
    updateRotationCenter() {
        const tileSize = GameConfig.rendering.tileSize;
        const translationX = Math.floor((this.width - 1) / 2 / tileSize) * tileSize;
        const translationY = Math.floor((this.height - 1) / 2 / tileSize) * tileSize;
        this.rotationCenter.x = this.position.x + translationX + tileSize / 2;
        this.rotationCenter.y = this.position.y + translationY + tileSize / 2;
    }



    // update composite objects
    updateCompositeObjects() {
        const tileSize = GameConfig.rendering.tileSize;
        for (let i in this.compositeObjects) {
            const compositeObject = this.compositeObjects[i];
            compositeObject.position.x = this.position.x + i * tileSize;
            compositeObject.position.y = this.position.y;
            compositeObject.rotation = this.rotation;
            compositeObject.rotationCenter.x = this.rotationCenter.x;
            compositeObject.rotationCenter.y = this.rotationCenter.y;
        }
    }



    // object follows cursor/remote cursor position
    followObject({object, func = () => {}}) {
        if (object.previousGridPosition.x != object.gridPosition.x ||
            object.previousGridPosition.y != object.gridPosition.y) {
            const tileSize = GameConfig.rendering.tileSize;
            const translationX = Math.floor((this.width - 1) / 2 / tileSize) * tileSize;
            const translationY = Math.floor((this.height - 1) / 2 / tileSize) * tileSize;
            this.position.x = gameServices.grid.position.x + object.gridPosition.x * tileSize - translationX;
            this.position.y = gameServices.grid.position.y + object.gridPosition.y * tileSize - translationY;
            func();
        }
    }



    // rotate control
    rotateControl() {
        const keys = gameServices.inputSystem.keys;
        if (this.rotatable && !keys.r.previousPressed && keys.r.pressed && !keys.shift.pressed) {
            this.rotation += 90;
            if (this.rotation == 360) { this.rotation = 0; }
            if (this.attachment) { this.attachment.rotation = this.rotation; }

            gameServices.user.placeableObject.rotation   = this.rotation;
            gameServices.user.placeableObject.position.x = this.position.x;
            gameServices.user.placeableObject.position.y = this.position.y;
            gameServices.socketHandler.sendUpdatePlaceableObject();
        }
    }



    // place control
    placeControl() {
        const cursorSystem = gameServices.cursorSystem;
        if (this.placeable && !cursorSystem.leftClick.previousPressed && cursorSystem.leftClick.pressed) {
            this.placed = true;
            gameServices.user.placeableObject.placed = true;
            gameServices.user.placeableObject.position.x = this.position.x;
            gameServices.user.placeableObject.position.y = this.position.y;
            cursorSystem.hideCursor();
            gameServices.socketHandler.sendUpdatePlaceableObject();
        }
    }



    // Choose this object from the crate
    choose() {
        this.chose = true;
        gameServices.soundSystem.play('select');
        this._restoreCrateScale();
        gameServices.user.placeableObject.chose = true;
        gameServices.user.placeableObject.crateIndex = this.crateIndex;
        gameServices.cursorSystem.hideCursor();
        gameServices.socketHandler.sendUpdatePlaceableObject();
    }



    // Transform this object if it's a "random" type (returns new object or self)
    transformIfRandom() {
        // Check if this is a random object
        if (this.type !== 'random') {
            return this; // Not a random object, return unchanged
        }

        // Get seed and list of actual objects (exclude "random" itself)
        const seed = gameState.get('match.seed');
        const objectCrate = gameServices.objectCrate;
        const actualObjectIds = objectCrate.allObjectIds.filter(id => id !== 'random');
        
        // Use seeded random so all clients pick the same replacement
        const rng = syncedRandom(seed + 20000 + this.crateIndex);
        const randomIndex = Math.floor(rng * actualObjectIds.length);
        const newObjectId = actualObjectIds[randomIndex];
        
        // Create replacement object
        const newObject = gameServices.entityFactory.createPlaceableObject(newObjectId);
        newObject.crateIndex = this.crateIndex;
        newObject.chose = true;
        newObject.position = {...this.position};
        newObject.rotation = this.rotation;
        newObject._initIdle();
        
        return newObject;
    }



    // apply a display-only scale-down for the crate (restores on choose)
    _applyCrateScale(scaleF) {
        this._crateOriginalScale  = this.scale;
        this._crateOriginalWidth  = this.width;
        this._crateOriginalHeight = this.height;
        this.scale  *= scaleF;
        this.width   = Math.round(this.width  * scaleF);
        this.height  = Math.round(this.height * scaleF);

        if (this.attachment) {
            const a = this.attachment;
            a._crateOriginalScale  = a.scale;
            a._crateOriginalRelX   = a.relativePosition.x;
            a._crateOriginalRelY   = a.relativePosition.y;
            a.scale               *= scaleF;
            if (a.width  !== undefined) { a.width  = Math.round(a.width  * scaleF); }
            if (a.height !== undefined) { a.height = Math.round(a.height * scaleF); }
            a.relativePosition.x   = Math.round(a.relativePosition.x * scaleF);
            a.relativePosition.y   = Math.round(a.relativePosition.y * scaleF);
        }
    }

    // restore original scale/size after crate display
    _restoreCrateScale() {
        if (this._crateOriginalScale === undefined) { return; }
        this.scale  = this._crateOriginalScale;
        this.width  = this._crateOriginalWidth;
        this.height = this._crateOriginalHeight;
        delete this._crateOriginalScale;
        delete this._crateOriginalWidth;
        delete this._crateOriginalHeight;

        if (this.attachment) {
            const a = this.attachment;
            a.scale              = a._crateOriginalScale;
            a.relativePosition.x = a._crateOriginalRelX;
            a.relativePosition.y = a._crateOriginalRelY;
            if (a.imageLoaded) {
                a.width  = Math.round(a.image.width  / a.frameRate * a.scale);
                a.height = Math.round(a.image.height * a.scale);
            }
            delete a._crateOriginalScale;
            delete a._crateOriginalRelX;
            delete a._crateOriginalRelY;
        }
    }



    // rotate
    rotate() {
        const rotatedHitbox = rotate90deg({
            object: {
                position: {
                    x: this.position.x + this.hitbox.position.x,
                    y: this.position.y + this.hitbox.position.y
                },
                width: this.hitbox.width,
                height: this.hitbox.height
            },
            center: this.rotationCenter
        });
        this.hitbox.position.x = rotatedHitbox.position.x - this.position.x;
        this.hitbox.position.y = rotatedHitbox.position.y - this.position.y;
        this.hitbox.width = rotatedHitbox.width;
        this.hitbox.height = rotatedHitbox.height;
    }






    // Convert this placeable object to a placed object in the world
    convertToPlacedObject() {
        // Composite containers (e.g. 1x2 spikes) only place their children, not themselves
        if (this.compositeObjects.length > 0) {
            for (let i in this.compositeObjects) {
                const compositeObject = this.compositeObjects[i];
                if (compositeObject.placeable) {
                    compositeObject.convertToPlacedObject();
                }
            }
            return;
        }

        // Create placed object
        return new PlacedObject({
            position: {...this.position},
            texture: this.texture,
            width: this.width,
            height: this.height,
            hitbox: {...this.hitbox, position: {...this.hitbox.position}},
            rotation: this.rotation,
            rotationCenter: {...this.rotationCenter},
            needSupport: this.needSupport,
            explosion: this.explosion,
            attachment: this.attachment,
            spriteOffset: this.spriteOffset,
            animations: this.animations,
            crateIndex: this.crateIndex
        });
    }



    // Rotate composite objects
    rotateCompositeObjects() {
        for (let i in this.compositeObjects) {
            this.compositeObjects[i].rotate();
        }
    }



    // Check if object is placeable
    checkPlaceable() {
        this.placeable = true;
        
        // check collision
        const thisCollisionBlock = {
            position: {
                x: this.position.x + this.hitbox.position.x + 1,
                y: this.position.y + this.hitbox.position.y + 1
            },
            width: this.hitbox.width - 2,
            height: this.hitbox.height - 2
        };
        // check support
        let bottom = {
            position: {x: this.position.x + 1, y: this.position.y + this.height},
            width: this.width - 2,
            height: 0
        };
        if (this.needSupport) {
            this.placeable = false;
            const numberOfRotations = this.rotation / 90;
            for (let i = 0; i < numberOfRotations; i++) {
                bottom = rotate90deg({object: bottom, center: this.rotationCenter});
            }
        }
        // change placeable state
        for (let i in gameServices.collisionSystem.blocks) {
            const collisionBlock = gameServices.collisionSystem.blocks[i];
            if (!this.explosion &&
                collision({object1: thisCollisionBlock, object2: collisionBlock})) {
                this.placeable = false;
                break;
            }
            if (this.needSupport &&
                collision({object1: bottom, object2: collisionBlock})) {
                this.placeable = true;
            }
        }
        if (!this.explosion) {
            for (let i in gameServices.collisionSystem.damageBlocks) {
                if (collision({object1: thisCollisionBlock, object2: gameServices.collisionSystem.damageBlocks[i]})) {
                    this.placeable = false;
                    break;
                }
            }
        }
        const spawnArea = gameServices.spawnArea;
        const finishArea = gameServices.finishArea;
        if ((spawnArea && collision({object1: thisCollisionBlock, object2: spawnArea.hitbox})) ||
            (finishArea && collision({object1: thisCollisionBlock, object2: finishArea.hitbox}))) {
            this.placeable = false;
        }
        for (let i in this.compositeObjects) {
            const compositeObject = this.compositeObjects[i];
            compositeObject.checkPlaceable();
            if (compositeObject.placeable) { this.placeable = true; }
        }
        // change cursor
        if (this.main && !gameServices.user.placeableObject.placed && this.crateIndex === gameServices.user.placeableObject.crateIndex) {
            if (this.placeable) { gameServices.cursorSystem.showCursor(); }
            else { gameServices.cursorSystem.showCursor("block"); }
        }
    }



    // check rotation
    checkRotation() {
        if (this.previousRotation != this.rotation) {
            const numberOfRotations = ((this.rotation - this.previousRotation) / 90 + 4) % 4;
            for (let i = 0; i < numberOfRotations; i++) {
                this.rotateCompositeObjects();
                this.rotate();
                if (this.attachment) { this.attachment.rotate(); }
            }
            this.checkPlaceable();
        }
        this.previousRotation = this.rotation;
    }



    // Check placement and convert to PlacedObject when placed
    checkPlacement() {
        if (!this.previousPlaced && this.placed) {
            gameServices.soundSystem.play('place');
            this.convertToPlacedObject();
        }
        this.previousPlaced = this.placed;
    }



    // Reset states
    resetStates() {
        this.highlighted = false;
    }

}

