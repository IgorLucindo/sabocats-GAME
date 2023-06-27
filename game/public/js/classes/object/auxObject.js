// collisionBlock class
class AuxObject extends Sprite{
    constructor({relativePosition, imageSrc, hitbox, movement = ()=>{}}){
        super({position: {x: 0, y: 0}, imageSrc, scale: playerScale});
        this.relativePosition = relativePosition;
        this.mainObjectPosition = {x: 0, y: 0};
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.originalMovement = movement;
        this.movement = movement;
        this.rotation = 0;
        this.rotationCenter = {x: 0, y: 0};
    };



    // update auxilliary object
    update({mainObject}){
        c.save();
        this.mainObjectPosition.x = mainObject.position.x;
        this.mainObjectPosition.y = mainObject.position.y;
        this.rotation = mainObject.rotation;
        this.updatePosition();
        this.updateHitbox();

        if(playingPhase){this.updateFrames();}

        if(!this.rotation){this.draw();}
        else{this.drawRotated(this.rotation, this.rotationCenter);}
        c.restore();
    };



    // update position
    updatePosition(){
        const movement = this.movement(this.elapsedFrames);
        this.position.x = this.mainObjectPosition.x + this.relativePosition.x + movement.x;
        this.position.y = this.mainObjectPosition.y + this.relativePosition.y + movement.y;
    };



    // update hitbox
    updateHitbox(){
        this.hitbox.position.x = this.position.x - this.relativePosition.x + this.hitbox.relativePosition.x;
        this.hitbox.position.y = this.position.y - this.relativePosition.y + this.hitbox.relativePosition.y;
    };



    // get rotation center
    getRotationCenter({mainCenter}){
        this.rotationCenter.x = mainCenter.x - this.relativePosition.x
        this.rotationCenter.y = mainCenter.y - this.relativePosition.y;
    };



    // rotate
    rotate(center){
        const rotatedHitbox = rotate90deg({
            object: {
                position: {
                    x: this.mainObjectPosition.x + this.relativePosition.x + this.hitbox.relativePosition.x,
                    y: this.mainObjectPosition.y + this.relativePosition.y + this.hitbox.relativePosition.y
                },
                width: this.hitbox.width,
                height: this.hitbox.height
            },
            center: {
                x: this.mainObjectPosition.x + center.x,
                y: this.mainObjectPosition.y + center.y
            }
        });
        this.hitbox.relativePosition.x = rotatedHitbox.position.x - this.mainObjectPosition.x - this.relativePosition.x;
        this.hitbox.relativePosition.y = rotatedHitbox.position.y - this.mainObjectPosition.y - this.relativePosition.y;
        this.hitbox.width = rotatedHitbox.width;
        this.hitbox.height = rotatedHitbox.height;
        // rotate movement function
        if(this.rotation == 270){this.movement = this.originalMovement;}
        else{
            const movementTemp = this.movement;
            this.movement = (time) => {
                const movement = movementTemp(time);
                return {x: -movement.y, y: movement.x};
            };
        }
    };
};