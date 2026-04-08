import { Sprite } from './Sprite.js';

// AnimatedSprite — extends Sprite with named animation switching and idle animation support.
// Shared base for Character, PlaceableObject, and ObjectAttachment.
export class AnimatedSprite extends Sprite {
    constructor(spriteParams) {
        super(spriteParams);
        this.animations     = null;
        this._idleActive    = false;
        this._idleCountdown = 0;
    }

    // Load all named animations and activate the initial sprite.
    // Creates Image objects for every entry, then replaces this.image with initialKey's image.
    // Use for classes whose primary image IS one of the named animations (Character, ObjectAttachment).
    _loadAnimations(animations, initialKey) {
        this.animations = animations;
        for (const key in animations) {
            const image = new Image();
            image.src = animations[key].texture;
            animations[key].image = image;
        }
        const initial    = animations[initialKey];
        this.imageLoaded = false;
        this.frameRate   = initial.frameRate ?? 1;
        this.frameBuffer = initial.frameBuffer ?? 3;
        this.image = new Image();
        this.image.onload = () => {
            this.width  = this.image.width / this.frameRate * this.scale;
            this.height = this.image.height * this.scale;
            this.imageLoaded = true;
        };
        this.image.src = initial.texture;
    }

    // Switch to the named animation. Returns true if the switch actually happened.
    // Silently skips if: animation is missing, image is already active, or not yet loaded.
    switchSprite(key) {
        const anim = this.animations?.[key];
        if (!anim || this.image === anim.image || !this.imageLoaded) { return false; }
        this.elapsedFrames = 0;
        this.currentFrame  = 0;
        this.image         = anim.image;
        this.frameRate     = anim.frameRate ?? 1;
        this.frameBuffer   = anim.frameBuffer ?? 3;
        if (anim.image.complete && anim.image.naturalWidth > 0) {
            this.width  = anim.image.width  / this.frameRate * this.scale;
            this.height = anim.image.height * this.scale;
        }
        return true;
    }

    // Initialise idle state; call once after animations are registered.
    // No-op if animations has no 'idle' entry.
    _initIdle() {
        if (this.animations?.idle) {
            this._idleCountdown = this._randomIdleInterval();
        }
    }

    // Advance idle countdown; plays idle spritesheet once then reverts to 'default'.
    _tickIdle() {
        if (!this._idleActive) {
            if (--this._idleCountdown <= 0) {
                this._idleActive = true;
                this.switchSprite('idle');
            }
        } else {
            if (++this.elapsedFrames % this.frameBuffer === 0) {
                if (this.currentFrame < this.frameRate - 1) {
                    this.currentFrame++;
                } else {
                    this._idleActive = false;
                    this.switchSprite('default');
                    this._idleCountdown = this._randomIdleInterval();
                }
            }
        }
    }

    _randomIdleInterval() {
        const { minInterval, maxInterval } = this.animations.idle;
        return minInterval + Math.floor(Math.random() * (maxInterval - minInterval + 1));
    }
}
