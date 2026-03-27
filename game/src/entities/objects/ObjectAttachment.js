import { ctx } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { rotate90deg } from '../../helpers.js';
import { Sprite } from '../Sprite.js';

// ObjectAttachment - An animated secondary part attached to a PlaceableObject (e.g. a moving saw blade)
export class ObjectAttachment extends Sprite {
    constructor({relativePosition, animations, mainObject, hitbox, movement = () => {}}) {
        super({position: {x: 0, y: 0}, texture: animations.default.texture, scale: GameConfig.rendering.pixelScale});
        this.relativePosition = relativePosition;

        this.animations = animations;
        for (let key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        }

        this.mainObject = mainObject;
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.originalMovement = movement;
        this.movement = movement;
        this.rotation = 0;
    }



    // switch to animation by key
    switchSprite(key) {
        if (this.image == this.animations[key].image || !this.imageLoaded) { return; }
        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
    }



    // update attachment
    update() {
        this.updatePosition();
        this.updateHitbox();

        if (gameServices.matchStateMachine.getState() === "playing") {
            this.switchSprite("animated");
            this.updateFrames();
        } else { this.switchSprite("default"); }
    }



    // render attachment
    render() {
        ctx.save();

        if (!this.rotation) { this.draw(); }
        else { this.drawRotated(this.rotation, this.mainObject.rotationCenter); }
        ctx.restore();
    }



    // update world position from main object
    updatePosition() {
        const tileSize = GameConfig.rendering.tileSize;
        const originalMovement = this.originalMovement(this.elapsedFrames);
        this.position.x = this.mainObject.position.x + this.relativePosition.x + originalMovement.x * tileSize;
        this.position.y = this.mainObject.position.y + this.relativePosition.y + originalMovement.y * tileSize;
    }



    // update hitbox world position
    updateHitbox() {
        const tileSize = GameConfig.rendering.tileSize;
        const movement = this.movement(this.elapsedFrames);
        this.hitbox.position.x = this.mainObject.position.x + this.hitbox.relativePosition.x + movement.x * tileSize;
        this.hitbox.position.y = this.mainObject.position.y + this.hitbox.relativePosition.y + movement.y * tileSize;
    }



    // rotate hitbox and movement 90 degrees
    rotate() {
        const rotatedHitbox = rotate90deg({
            object: {
                position: {
                    x: this.mainObject.position.x + this.hitbox.relativePosition.x,
                    y: this.mainObject.position.y + this.hitbox.relativePosition.y
                },
                width: this.hitbox.width,
                height: this.hitbox.height
            },
            center: this.mainObject.rotationCenter
        });
        this.hitbox.relativePosition.x = rotatedHitbox.position.x - this.mainObject.position.x;
        this.hitbox.relativePosition.y = rotatedHitbox.position.y - this.mainObject.position.y;
        this.hitbox.width = rotatedHitbox.width;
        this.hitbox.height = rotatedHitbox.height;
        // rotate movement function
        if (this.rotation == 0) { this.movement = this.originalMovement; }
        else {
            const movementTemp = this.movement;
            this.movement = (time) => {
                const movement = movementTemp(time);
                return {x: -movement.y, y: movement.x};
            };
        }
    }
}
