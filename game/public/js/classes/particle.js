class Particle extends Sprite{
    constructor({relativePosition, imageSrc, frameRate, frameBuffer}){
        super({imageSrc, frameRate, frameBuffer, scale: playerScale});
        this.idNumber = undefined;
        this.position = {x: 0, y: 0};
        this.relativePosition = relativePosition;
    };



    // update function
    update(){
        c.save();
        this.updateFrames();
        this.draw();
        if(this.currentFrame == this.frameRate - 1){
            delete allParticles[this.idNumber];
        }
        c.restore();
    };



    // update position
    updatePosition(){
        this.position.x = player.position.x + this.relativePosition.x;
        this.position.y = player.position.y + this.relativePosition.y;
    };
};