class RemotePlayer extends Sprite {
    constructor({ position, animations, currentSprite }) {
        super({ texture: animations.idleSit.texture, frameRate: animations.idleSit.frameRate, scale: properties.pixelScale });
        this.position = position;

        this.animations = animations;
        for (let key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        };
        this.finished = false;
        this.loaded = true;
        this.dead = false;
        this.currentSprite = currentSprite;
    };



    // change to key sprite
    switchSprite(key) {
        if (this.image == this.animations[key].image || !this.loaded) { return; }
        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
    };



    // per-frame update
    update() {
        if (this.loaded) { this.switchSprite(this.currentSprite); }
    };

    // render remote player
    render() {
        if (!this.loaded) { return; }
        this.updateFrames();
        this.draw();
    };
};
