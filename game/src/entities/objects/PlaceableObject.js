import { ctx } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { collision, rotate90deg } from '../../helpers.js';
import { gameState } from '../../core/GameState.js';
import { Sprite } from '../Sprite.js';

// PlaceableObject - A game object selected from the box and placed on the map
export class PlaceableObject extends Sprite {
    constructor({idNumber, position, texture, width, height, hitbox, rotatable, needSupport, compositeObject, objectAttachmentId}) {
        super({position, texture, scale: GameConfig.rendering.pixelScale});
        this.idNumber = idNumber;
        this.crateIndex = undefined;
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.main = true;

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

        this.compositeObjects = [];
        for (let i = 0; i < compositeObject.number; i++) {
            const compositeObjectTemp = gameServices.entityFactory.createPlaceableObject(compositeObject.id);
            compositeObjectTemp.main = false;
            this.compositeObjects.push(compositeObjectTemp);
        }

        if (objectAttachmentId) {
            this.attachment = gameServices.entityFactory.createObjectAttachment(objectAttachmentId, this);
        }
    }



    // update object
    update() {
        if (this.attachment) { this.attachment.update(); }
    }

    // update object in choosing state
    updateInChoosing() {
        if (this.chose) { return; }

        if (!gameServices.user.placeableObject.chose) {
            this.mouseOver({object: this, func: () => { this.choose(); }});
        }
        this.update();
    }

    // update object in placing state
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
        if (this.rotatable && !keys.e.previousPressed && keys.e.pressed && !keys.shift.pressed) {
            this.rotation += 90;
            if (this.rotation == 360) { this.rotation = 0; }
            if (this.attachment) { this.attachment.rotation = this.rotation; }

            gameServices.user.placeableObject.rotation = this.rotation;
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



    // choose
    choose() {
        this.chose = true;
        gameServices.user.placeableObject.chose = true;
        gameServices.user.placeableObject.crateIndex = this.crateIndex;
        gameServices.cursorSystem.hideCursor();
        gameServices.socketHandler.sendUpdatePlaceableObject();
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



    // place
    place() {
        gameServices.matchObjects.push(this);

        this.collisionBlock = gameServices.collisionSystem.createBlock({
            position: {
                x: this.position.x + this.hitbox.position.x,
                y: this.position.y + this.hitbox.position.y
            },
            width: this.hitbox.width,
            height: this.hitbox.height,
            death: this.hitbox.death
        });

        if (this.attachment) {
            this.attachment.collisionBlock = gameServices.collisionSystem.createBlock(this.attachment.hitbox);
        }
    }



    // rotate composite objects
    rotateCompositeObjects() {
        for (let i in this.compositeObjects) {
            this.compositeObjects[i].rotate();
        }
    }



    // place composite objects
    placeCompositeObjects() {
        for (let i in this.compositeObjects) {
            const compositeObject = this.compositeObjects[i];
            compositeObject.checkPlaceable();
            if (compositeObject.placeable) { compositeObject.place(); }
        }
    }



    // check if object is placeable
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
        const finishAreaCollision = {
            position: gameServices.interactionSystem.areas[0].position,
            width: gameServices.interactionSystem.areas[0].hitbox.width,
            height: gameServices.interactionSystem.areas[0].hitbox.height
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
            if (collisionBlock.placingPhaseCollision &&
                collision({object1: thisCollisionBlock, object2: collisionBlock})) {
                this.placeable = false;
                break;
            }
            if (this.needSupport &&
                collision({object1: bottom, object2: collisionBlock})) {
                this.placeable = true;
            }
        }
        const spawnArea = gameState.get('map.spawnArea');
        if (collision({object1: thisCollisionBlock, object2: spawnArea}) ||
            collision({object1: thisCollisionBlock, object2: finishAreaCollision})) {
            this.placeable = false;
        }
        for (let i in this.compositeObjects) {
            const compositeObject = this.compositeObjects[i];
            compositeObject.checkPlaceable();
            if (compositeObject.placeable) { this.placeable = true; }
        }
        // change cursor
        if (this.main) {
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



    // check placement
    checkPlacement() {
        if (!this.previousPlaced && this.placed) {
            if (this.compositeObjects.length) { this.placeCompositeObjects(); }
            else { this.place(); }
        }
        this.previousPlaced = this.placed;
    }



    // reset states
    resetStates() {
        this.highlighted = false;
    }
}
