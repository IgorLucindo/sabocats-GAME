// auxiliary object class
class AuxObject extends Sprite{
    constructor({relativePosition, animations, mainObject, hitbox, movement = ()=>{}}){
        super({position: {x: 0, y: 0}, texture: animations.default.texture, scale: properties.pixelScale});
        this.relativePosition = relativePosition;

        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        };

        this.mainObject = mainObject;
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.originalMovement = movement;
        this.movement = movement;
        this.rotation = 0;
    };



    // change to key sprite
    switchSprite(key){
        if(this.image == this.animations[key].image || !this.imageLoaded){return;}
        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
    };



    // update auxilliary object
    update(){
        this.updatePosition();
        this.updateHitbox();

        if(match.state === "playing"){this.switchSprite("animated");}
        else{this.switchSprite("default");}
    };



    // render auxilliary object
    render(){
        ctx.save();
        if(match.state === "playing"){this.updateFrames();}
        
        if(!this.rotation){this.draw();}
        else{this.drawRotated(this.rotation, this.mainObject.rotationCenter);}
        ctx.restore();
    };



    // update position
    updatePosition(){
        const originalMovement = this.originalMovement(this.elapsedFrames);
        this.position.x = this.mainObject.position.x + this.relativePosition.x + originalMovement.x * properties.tileSize;
        this.position.y = this.mainObject.position.y + this.relativePosition.y + originalMovement.y * properties.tileSize;
    };



    // update hitbox
    updateHitbox(){
        const movement = this.movement(this.elapsedFrames);
        this.hitbox.position.x = this.mainObject.position.x + this.hitbox.relativePosition.x + movement.x * properties.tileSize;
        this.hitbox.position.y = this.mainObject.position.y + this.hitbox.relativePosition.y + movement.y * properties.tileSize;
    };



    // rotate
    rotate(){
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
        if(this.rotation == 0){this.movement = this.originalMovement;}
        else{
            const movementTemp = this.movement;
            this.movement = (time) => {
                const movement = movementTemp(time);
                return {x: -movement.y, y: movement.x};
            };
        }
    };
};