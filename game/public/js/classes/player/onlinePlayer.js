// online player class
class OnlinePlayer extends Sprite{
    constructor({position, imageSrc, frameRate, scale = 1, animations, currentSprite}){
        super({imageSrc, frameRate, scale});
        this.position = position;

        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        };
        this.finished = false;
        this.loaded = false;
        this.died = false;
        this.currentSprite = currentSprite;
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



    // update online player
    update(){
        this.updateFrames();
        this.draw();
    };
};