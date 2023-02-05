// online player class
class OnlinePlayer extends Sprite{
    constructor({position, imageSrc, frameRate, scale = .1, animations, currentSprite}){
        super({imageSrc, frameRate, scale});
        this.position = position;
        this.hitbox = {
            position: {x: 0, y: 0},
            width: 195 * this.scale,
            height: 200 * this.scale
        };

        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        };
        this.finished = false;
        this.loaded = false;
        this.currentSprite = currentSprite;
    };



    switchSprite(key){
        if(this.image == this.animations[key].image || !this.loaded){return;}
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
        this.lastSprite = key;
    };



    // update online player
    update(){
        this.updateFrames();
        this.draw();
    };
};