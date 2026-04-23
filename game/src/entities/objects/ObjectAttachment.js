import { ctx } from '../../core/RenderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { rotate90deg } from '../../helpers.js';
import { AnimatedSprite } from '../AnimatedSprite.js';

// ObjectAttachment - An animated secondary part attached to a PlaceableObject (e.g. a moving saw blade)
export class ObjectAttachment extends AnimatedSprite {
    constructor({relativePosition, animations, mainObject, hitbox, movement = () => {}, idleSound, idleSoundCooldown}) {
        super({position: {x: 0, y: 0}});
        this.relativePosition = relativePosition;

        this._loadAnimations(animations, 'default');

        this.mainObject = mainObject;
        this.hitbox = hitbox;
        this.damageBlock = undefined;
        this.originalMovement = movement;
        this.movement = movement;
        this.rotation = 0;
        this.idleSound = idleSound;
        this.idleSoundCooldown = idleSoundCooldown;
    }



    // update attachment
    update() {
        this.updatePosition();
        this.updateHitbox();

        if (this._currentKey === "animated") {
            if (this.idleSound && gameServices.matchStateMachine.getState() === "playing") {
                gameServices.soundSystem.playWorldCooldown(this.idleSound, this.position, { broadcast: true }, this.idleSoundCooldown);
            }
            this.updateFrames();
        }
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
