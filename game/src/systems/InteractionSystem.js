import { ctx } from '../core/renderContext.js';
import { gameServices } from '../core/GameServices.js';
import { GameConfig } from '../core/DataLoader.js';
import { Sprite } from '../entities/Sprite.js';
import { collision } from '../helpers.js';

// InteractableArea - A world zone that triggers actions when the player enters it
class InteractableArea extends Sprite {
    constructor({position, hitbox, sprite = {}, pressable = false, func, highlightable = false}) {
        const { texture, frameRate = 1, frameBuffer = 3, offset = { x: 0, y: 0 }, scale = 1 } = sprite;
        const spritePos = { x: position.x + offset.x, y: position.y + offset.y };
        super({position: spritePos, texture, frameRate, frameBuffer, scale, highlightUp: true});
        this.hitbox = hitbox;
        this.hitbox.position = {x: position.x, y: position.y};
        this.func = func;
        this.pressable = pressable;
        this.highlightable = highlightable;
        this.highlighted = false;

        if (pressable && highlightable) {
            this.keySprite = new Sprite({
                position: {x: this.position.x, y: this.position.y},
                texture: "assets/textures/keys/e.png",
                frameRate: GameConfig.ui.keySprite.frameRate,
                frameBuffer: GameConfig.ui.keySprite.frameBuffer
            });
            const keySpriteSize = GameConfig.ui.keySprite.size;
            this.keySprite.position.x += (this.hitbox.width - keySpriteSize) / 2;
            this.keySprite.position.y -= (keySpriteSize + GameConfig.ui.keySprite.offsetY);
        }
    }

    // update area — check player overlap and trigger func
    update() {
        this.updateFrames();
        this.resetStates();
        const player = gameServices.player;
        const keys = gameServices.inputSystem.keys;
        if (player.loaded && collision({object1: player.hitbox, object2: this.hitbox})) {
            if (this.highlightable) { this.highlighted = true; }
            if ((this.pressable && !keys.e.previousPressed && keys.e.pressed) || !this.pressable) {
                this.func();
            }
        }
        if (this.highlighted && this.keySprite) { this.keySprite.updateFrames(); }
    }

    // render area with fixed overlay, key prompt, and highlight
    render() {
        ctx.save();
        if (gameServices.matchStateMachine.getState() === 'placing') {
            ctx.fillStyle = "rgba(80, 80, 80, 0.4)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.strokeStyle = "rgb(100, 100, 100)";
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.setLineDash([]);
        }

        if (this.highlighted) {
            this.keySprite.draw();
        }
        this.renderHighlight();
        this.draw();
        ctx.restore();
    }

    // reset per-frame states
    resetStates() {
        this.highlighted = false;
    }
}

// InteractionSystem - Centralized collision-based interaction handling

export class InteractionSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.areas = [];
  }

  initialize() {}

  update() {
    for (let i in this.areas) {
        this.areas[i].update();
    }
  }

  shutdown() {
    this.areas = [];
  }

  createArea(config) {
    const area = new InteractableArea(config);
    this.areas.push(area);
    return area;
  }
}
