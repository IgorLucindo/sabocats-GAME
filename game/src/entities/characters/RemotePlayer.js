import { GameConfig } from '../../core/DataLoader.js';
import { Sprite } from '../Sprite.js';

export class RemotePlayer extends Sprite {
    constructor() {
        super({ texture: null, frameRate: 1, scale: GameConfig.rendering.pixelScale, position: { x: 0, y: 0 } });
        this.position = { x: 0, y: 0 };
        this.animations = null;
        this.characterId = null;
        this.finished = false;
        this.loaded = false;
        this.dead = false;
        this.currentSprite = "idleSit";
    }

    loadCharacter(id, animations, position = { x: 0, y: 0 }, currentSprite = "idleSit") {
        this.characterId = id;
        this.animations = animations;
        for (let key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        };

        this.imageLoaded = false;
        this.frameRate = animations.idleSit.frameRate;
        this.frameBuffer = animations.idleSit.frameBuffer;
        this.image = new Image();
        this.image.onload = () => {
            this.width = this.image.width / this.frameRate * this.scale;
            this.height = this.image.height * this.scale;
            this.imageLoaded = true;
        };
        this.image.src = animations.idleSit.texture;

        this.position.x = position.x;
        this.position.y = position.y;
        this.currentSprite = currentSprite;
        this.finished = false;
        this.dead = false;
        this.loaded = true;
    }

    resetForMatch() {
        this.dead = false;
        this.finished = false;
    }

    // change to key sprite
    switchSprite(key) {
        if (this.image == this.animations[key].image || !this.loaded) { return; }
        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
    }

    // per-frame update
    update() {
        if (this.loaded) { this.switchSprite(this.currentSprite); }
    }

    // render remote player
    render() {
        if (!this.loaded) { return; }
        this.updateFrames();
        this.draw();
    }
}
