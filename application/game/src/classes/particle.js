class Particle extends Sprite{
    constructor({relativePosition, texture, frameRate, frameBuffer}){
        super({texture, frameRate, frameBuffer, scale: properties.pixelScale});
        this.idNumber = undefined;
        this.position = {x: 0, y: 0};
        this.relativePosition = relativePosition;
    };



    // update
    update(){
        if(this.currentFrame == this.frameRate - 1){
            delete allParticles[this.idNumber];
        }
    };



    // render
    render(){
        ctx.save();
        this.updateFrames();
        this.draw();
        ctx.restore();
    };



    // set position
    setPosition(){
        this.position.x = player.position.x + this.relativePosition.x;
        this.position.y = player.position.y + this.relativePosition.y;
    };
};