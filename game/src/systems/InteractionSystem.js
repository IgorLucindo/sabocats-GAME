import { ctx, showHitboxes } from '../core/RenderContext.js';
import { gameServices } from '../core/GameServices.js';
import { GameConfig } from '../core/DataLoader.js';
import { AnimatedSprite } from '../entities/AnimatedSprite.js';
import { Sprite } from '../entities/Sprite.js';
import { collision } from '../helpers.js';

// InteractableArea - A world zone that triggers actions when the player enters it
class InteractableArea extends AnimatedSprite {
    constructor({position, hitbox, animations = {}, onEnter = null, onStay = null, onPress = null, onExit = null, onRemoteEnter = null, onRemoteStay = null, onRemoteExit = null, cooldown = 0}) {
        super({ position: { ...position }, highlightStyle: 'tintUp' });
        if (animations.idle) this._loadAnimations(animations, 'idle');
        this.hitbox = hitbox;
        this.hitbox.position = {x: position.x, y: position.y};
        this.onEnter = onEnter;
        this.onStay = onStay;
        this.onPress = onPress;
        this.onExit = onExit;
        this.onRemoteEnter = onRemoteEnter;
        this.onRemoteStay = onRemoteStay;
        this.onRemoteExit = onRemoteExit;
        this.highlighted = false;
        this._cooldown = cooldown * 1000;
        this._lastTriggerTime = -Infinity;
        this._wasInArea = false;
        this._wasInAreaByUser = new Map();
        this._lastTriggerTimeByUser = new Map();

        if (onPress) {
            this.keySprite = new Sprite({
                position: {x: this.position.x, y: this.position.y},
                texture: "assets/textures/keys/eFloat.png",
                frameRate: GameConfig.ui.keySprite.frameRate,
                frameBuffer: GameConfig.ui.keySprite.frameBuffer
            });
            const keySpriteSize = GameConfig.ui.keySprite.size;
            this.keySprite.position.x += (this.hitbox.width - keySpriteSize) / 2;
            this.keySprite.position.y -= (keySpriteSize + GameConfig.ui.keySprite.offsetY);
        }
    }

    // update area — check player overlap and trigger callbacks
    update() {
        this.updateFrames();
        this.resetStates();
        const player = gameServices.player;
        const keys = gameServices.inputSystem.keys;
        const inArea = player.loaded && collision({object1: player.hitbox, object2: this.hitbox});
        if (inArea) {
            if (!this._wasInArea && this.onEnter) { this.onEnter(); }
            this._wasInArea = true;
            if (this.onPress) { this.highlighted = true; }
            if (this.onStay) {
                const now = performance.now();
                if (now - this._lastTriggerTime >= this._cooldown) {
                    this._lastTriggerTime = now;
                    this.onStay();
                }
            }
            if (this.onPress && !keys.e.previousPressed && keys.e.pressed) { this.onPress(); }
        } else if (this._wasInArea) {
            this._wasInArea = false;
            if (this.onExit) { this.onExit(); }
        }
        if (this.highlighted && this.keySprite) { this.keySprite.updateFrames(); }
        if (this.onRemoteEnter || this.onRemoteStay || this.onRemoteExit) { this._updateRemotePlayers(); }
    }

    _updateRemotePlayers() {
        const users = gameServices.users;
        const localId = gameServices.user.id;
        const now = performance.now();
        for (const id in users) {
            if (id === localId) continue;
            const remotePlayer = users[id].remotePlayer;
            if (!remotePlayer?.loaded) continue;
            const inArea = collision({ object1: remotePlayer.hitbox, object2: this.hitbox });
            const wasInArea = this._wasInAreaByUser.get(id) ?? false;
            if (inArea) {
                if (!wasInArea && this.onRemoteEnter) { this.onRemoteEnter(remotePlayer); }
                this._wasInAreaByUser.set(id, true);
                if (this.onRemoteStay) {
                    const lastTime = this._lastTriggerTimeByUser.get(id) ?? -Infinity;
                    if (now - lastTime >= this._cooldown) {
                        this._lastTriggerTimeByUser.set(id, now);
                        this.onRemoteStay(remotePlayer);
                    }
                }
            } else if (wasInArea) {
                this._wasInAreaByUser.set(id, false);
                if (this.onRemoteExit) { this.onRemoteExit(remotePlayer); }
            }
        }
    }

    // render area with key prompt and highlight
    render() {
        ctx.save();

        if (showHitboxes) {
            ctx.fillStyle = "rgba(217, 67, 255, 0.4)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
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

// ObjectiveArea — interactable zone that shows a grey overlay during placing/initial states (spawn and finish areas)
export class ObjectiveArea extends InteractableArea {
    constructor({ position, width, height, animations = {}, ...callbacks }) {
        super({ position, hitbox: { width, height }, animations, ...callbacks });
    }

    render() {
        ctx.save();
        const state = gameServices.matchStateMachine.getState();
        if (['initial', 'choosing', 'placing'].includes(state)) {
            const ps = GameConfig.rendering.pixelScale;
            ctx.fillStyle = "rgba(80, 80, 80, 0.4)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.strokeStyle = "rgb(100, 100, 100)";
            ctx.lineWidth = ps;
            ctx.setLineDash([3 * ps, 3 * ps]);
            ctx.strokeRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.setLineDash([]);
        }
        this.renderHighlight();
        this.draw();
        ctx.restore();
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
