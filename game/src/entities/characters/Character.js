import { AnimatedSprite } from '../AnimatedSprite.js';

// Character — base class for all playable character entities (Player, RemotePlayer).
// Owns animation loading, sprite switching, and dead-state sprite resolution.
export class Character extends AnimatedSprite {
    constructor(spriteParams) {
        super(spriteParams);
        this.dead       = false;
        this.finished   = false;
        this.loaded     = false;
        this.lastSprite = 'sit';
        this.deathType  = 'default';
    }

    // Load all animation images and set the initial sprite to sit.
    // Called by subclass loadCharacter implementations.
    _loadAnimations(animations) {
        super._loadAnimations(animations, 'sit');
    }

    // Switch to the animation identified by key, resolving dead variants automatically.
    // Always stores the base key in lastSprite, never the dead variant.
    // Silently skips if the resolved key does not exist (e.g. sprites not yet added).
    switchSprite(key) {
        const resolvedKey = this._resolveAnimationKey(key);
        if (super.switchSprite(resolvedKey)) {
            this.lastSprite = key;
        }
    }

    // Returns the animation key to use for dead characters.
    // Cascades: dead.<type>.<key> → dead.default.<key> → undefined (freeze on last sprite).
    _resolveAnimationKey(key) {
        if (!this.dead) { return key; }
        const typedKey = `dead.${this.deathType}.${key}`;
        if (this.animations?.[typedKey]) { return typedKey; }
        const defaultKey = `dead.default.${key}`;
        return this.animations?.[defaultKey] ? defaultKey : undefined;
    }
}
