import { GameConfig } from '../../core/DataLoader.js';
import { Character } from './Character.js';

export class RemotePlayer extends Character {
    constructor() {
        super({ texture: null, frameRate: 1, scale: GameConfig.rendering.pixelScale, position: { x: 0, y: 0 } });
        this.position = { x: 0, y: 0 };
        this.characterId = null;
        this.currentSprite = "idleSit";
    }

    loadCharacter(id, animations, position = { x: 0, y: 0 }, currentSprite = "idleSit") {
        this.characterId = id;
        this._loadAnimations(animations);

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

    // per-frame update
    update() {
        if (!this.loaded) { return; }
        this.switchSprite(this.currentSprite);
        this.updateFrames();
    }

    // render remote player
    render() {
        if (!this.loaded) { return; }
        this.draw();
    }
}
