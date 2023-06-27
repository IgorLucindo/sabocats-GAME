// selectable player class
class Particle extends Sprite{
    constructor({position, imageSrc, frameRate, frameBuffer, scale = 1, animations}){
        super({imageSrc, frameRate, frameBuffer, scale});
        this.particlePosition = position;
        this.position = {x: 0, y: 0};
        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        };
        this.loaded = false;
    };



    // change to key sprite
    switchSprite(key){
        if(this.image == this.animations[key].image || !this.loaded){return;}
        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
    };



    // update function
    update(){
        c.save();
        if(this.loaded){
            this.updateFrames();
            this.draw();
            if(this.currentFrame == this.frameRate - 1){
                this.loaded = false;
                this.currentFrame = 0;
            }
        }
        c.restore();
    };



    // update sprite position
    updateSpritePosition(key){
        this.position.x = this.particlePosition.x + this.animations[key].position.x;
        this.position.y = this.particlePosition.y + this.animations[key].position.y;
    };



    // change and load sprite
    playSprite(key){
        this.loaded = true;
        this.switchSprite(key);
        this.updateSpritePosition(key);
        this.currentFrame = 0;
    };
};