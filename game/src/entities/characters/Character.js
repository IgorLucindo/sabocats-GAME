import { Sprite } from '../Sprite.js';

// Character — base class for all playable character entities (Player, RemotePlayer).
// Owns animation loading, sprite switching, and dead-state sprite resolution.
export class Character extends Sprite {
    constructor(spriteParams) {
        super(spriteParams);
        this.animations = null;
        this.dead       = false;
        this.finished   = false;
        this.loaded     = false;
        this.lastSprite = "idleSit";
    }

    // Load all animation images and set the initial sprite to idleSit.
    // Called by subclass loadCharacter implementations.
    _loadAnimations(animations) {
        this.animations = animations;
        for (const key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        }
        this.imageLoaded = false;
        this.frameRate   = animations.idleSit.frameRate;
        this.frameBuffer = animations.idleSit.frameBuffer;
        this.image = new Image();
        this.image.onload = () => {
            this.width  = this.image.width / this.frameRate * this.scale;
            this.height = this.image.height * this.scale;
            this.imageLoaded = true;
        };
        this.image.src = animations.idleSit.texture;
    }

    // Switch to the animation identified by key, resolving dead variants automatically.
    // Always stores the base key in lastSprite, never the dead variant.
    switchSprite(key) {
        if (!this.imageLoaded) { return; }
        const resolvedKey = this._resolveAnimationKey(key);
        if (this.image === this.animations[resolvedKey].image) { return; }
        this.elapsedFrames = 0;
        this.currentFrame  = 0;
        this.image         = this.animations[resolvedKey].image;
        this.frameRate     = this.animations[resolvedKey].frameRate;
        this.frameBuffer   = this.animations[resolvedKey].frameBuffer;
        this.lastSprite    = key;
    }

    // Returns the animation key to use, appending "Dead" when the character is dead.
    // Falls back to idleStandDead/idleStandLeftDead if no specific dead sprite exists.
    // Direction is inferred from the key name ("Left" suffix → left-facing).
    _resolveAnimationKey(key) {
        if (!this.dead) { return key; }
        const deadKey = key + "Dead";
        if (this.animations[deadKey]) { return deadKey; }
        return key.includes("Left") ? "idleStandLeftDead" : "idleStandDead";
    }
}
