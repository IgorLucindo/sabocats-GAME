import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { Character } from './Character.js';

export class RemotePlayer extends Character {
    constructor() {
        super({ texture: null, frameRate: 1, position: { x: 0, y: 0 } });
        this.position = { x: 0, y: 0 };
        this.characterId = null;
        this.currentSprite = "sit";
        this.hitbox = {
            position: { x: 0, y: 0 },
            width: GameConfig.player.hitbox.width * this.scale,
            height: GameConfig.player.hitbox.height * this.scale
        };
    }

    loadCharacter(id, characterData, position = null, currentSprite = "sit") {
        this.characterId = id;
        this._loadAnimations(characterData.animations);

        const spawnArea = gameServices.spawnArea;
        const pos = position ?? (spawnArea ? {
            x: spawnArea.hitbox.position.x,
            y: spawnArea.hitbox.position.y + spawnArea.hitbox.height - GameConfig.player.hitbox.offset.y * this.scale - this.hitbox.height - 1
        } : { x: 0, y: 0 });

        this.position.x = pos.x;
        this.position.y = pos.y;
        this.currentSprite = currentSprite;
        this.finished = false;
        this.dead = false;
        this.loaded = true;
        this._updateHitbox();
    }

    resetForMatch() {
        this.dead = false;
        this.finished = false;
        const spawnArea = gameServices.spawnArea;
        if (spawnArea) {
            this.position.x = spawnArea.hitbox.position.x;
            this.position.y = spawnArea.hitbox.position.y + spawnArea.hitbox.height - GameConfig.player.hitbox.offset.y * this.scale - this.hitbox.height - 1;
            this._updateHitbox();
        }
    }

    _updateHitbox() {
        this.hitbox.position.x = this.position.x + GameConfig.player.hitbox.offset.x * this.scale;
        this.hitbox.position.y = this.position.y + GameConfig.player.hitbox.offset.y * this.scale;
    }

    // per-frame update
    update() {
        if (!this.loaded) { return; }
        this.switchSprite(this.currentSprite);
        this.updateFrames();
        this._updateHitbox();
    }

    // render remote player
    render() {
        if (!this.loaded) { return; }
        this.draw();
    }
}
