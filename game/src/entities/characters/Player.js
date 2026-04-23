import { ctx, debugMode } from '../../core/RenderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { deltaTime } from '../../core/timing.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { Character } from './Character.js';

export class Player extends Character {
    constructor() {
        super({ texture: null, frameRate: 1, position: { x: 0, y: 0 } });
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 1 };
        this.previousVelocity = { x: 0, y: 0 };
        this.gravityMultiplier = 1;
        this.hitbox = {
            position: { x: 0, y: 0 },
            width: GameConfig.player.hitbox.width * this.scale,
            height: GameConfig.player.hitbox.height * this.scale
        };
        this.hurtbox = {
            position: { x: 0, y: 0 },
            width: GameConfig.player.hurtbox.width * this.scale,
            height: GameConfig.player.hurtbox.height * this.scale
        };
        this.camerabox = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            width: GameConfig.player.camerabox.width * this.scale,
            height: GameConfig.player.camerabox.height * this.scale
        };

        this.direction = "right";
        this.coyoteTime = 0;
        this.jumpBufferTime = 0;
        this.grounded = false;
        this.previousGrounded = false;
        this.walljumpedFrom = null;
        this.jumped = false;
        this.jumpEvent = false;
        this.turned = false;
        this.touchingWall = { left: false, right: false };
        this.characterOption = null;

        this.wallSlideFrame = 0;
        this.idleFrame = 0;
        this.invulnerable = false;
        this._lookDownProgress = 0;
        this.deathSounds = {};

        this.lives = 0;
        this._respawnTimer = 0;
        this._invulnTimer = 0;
        this._spawnPosition = { x: 0, y: 0 };
    }

    loadCharacter(id, characterData, characterOption) {
        this._loadAnimations(characterData.animations);
        this.deathSounds = characterData.deathSounds || {};
        this.characterOption = characterOption;
        this._reset();
        this.position.x = characterOption.initialPosition.x;
        this.position.y = characterOption.initialPosition.y;
    }

    prepareForMatch(position) {
        const ms = gameState.get('room.matchSettings');
        this._reset();
        this.position.x = position.x;
        this.position.y = position.y;
        this.invulnerable = false;
        this._spawnPosition = { x: position.x, y: position.y };
        this.lives = ms.lives;
    }

    _reset() {
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.coyoteTime = 0;
        this.jumpBufferTime = 0;
        this.loaded = true;
        this.grounded = false;
        this.jumped = false;
        this.walljumpedFrom = null;
        this.jumpEvent = false;
        this.turned = false;
        this.touchingWall.left = false;
        this.touchingWall.right = false;
        this.finished = false;
        this.dead = false;
        this.deathType = 'default';
        this.direction = "right";
        this.lastSprite = "sit";
        this.wallSlideFrame = 0;
        this.idleFrame = 0;
        this.currentFrame = 0;
        this.elapsedFrames = 0;
        this._lookDownProgress = 0;
        this.lives = 0;
        this._respawnTimer = 0;
        this._invulnTimer = 0;
    }

    update() {
        if (!this.loaded) { return; }

        const { physicsSystem, collisionSystem, playerControlSystem, animationSystem,
                inputSystem, cameraSystem, cursorSystem, particleSystem } = gameServices;
        const keys   = inputSystem.keys;
        const blocks = collisionSystem.blocks;
        const damageBlocks = collisionSystem.damageBlocks;

        if (!this.dead && !this.finished) {
            const prevDirection = this.direction;
            playerControlSystem.processInput(this, keys);
            this.turned = this.direction !== prevDirection;
            if (keys.g.holdTime >= GameConfig.states.playing.giveUpHoldDuration && this.lives > 0) { this._forceKill(); }
        }
        physicsSystem.decelerate(this);
        physicsSystem.applyAirMovement(this);

        // Respawn countdown (dead but not finished = has lives remaining)
        if (this.dead && !this.finished) {
            this._respawnTimer -= deltaTime;
            if (this._respawnTimer <= 0) { this._respawn(); }
        }

        // Invulnerability countdown (after respawn)
        if (this._invulnTimer > 0) {
            this._invulnTimer -= deltaTime;
            if (this._invulnTimer <= 0) { this.invulnerable = false; }
        }

        // Horizontal pass
        physicsSystem.applyHorizontalVelocity(this);
        this.updateHitbox();
        this.updateHurtbox();
        collisionSystem.checkHorizontalCollisions(this, this.hitbox, blocks);
        collisionSystem.checkHorizontalCollisions(this, this.hurtbox, damageBlocks);
        collisionSystem.checkDamage(this, this.hurtbox, damageBlocks);

        // Vertical pass
        physicsSystem.applyVerticalVelocity(this);
        this.updateHitbox();
        this.updateHurtbox();
        collisionSystem.checkVerticalCollisions(this, this.hitbox, blocks);
        collisionSystem.checkVerticalCollisions(this, this.hurtbox, damageBlocks);
        collisionSystem.checkDamage(this, this.hurtbox, damageBlocks);

        this.updateCamerabox(keys);
        if (!this.dead && !this.finished) { cameraSystem.panCamera({ object: this.camerabox }); }

        if (gameServices.matchStateMachine.getState() === 'lobby' && cursorSystem.rightClick.pressed) {
            this.reselectPlayer();
        }

        this.updateFrames();
        animationSystem.updatePlayer(this);
        animationSystem.updateParticles(this, particleSystem);
    }

    render() {
        if (!this.loaded) { return; }

        this.draw();

        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 0, .2)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.fillStyle = "rgba(255, 165, 0, .3)";
            ctx.fillRect(this.hurtbox.position.x, this.hurtbox.position.y, this.hurtbox.width, this.hurtbox.height);
            ctx.fillStyle = "rgba(0, 255, 0, .1)";
            ctx.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }
    }

    updateHitbox() {
        this.hitbox.position.x = this.position.x + GameConfig.player.hitbox.offset.x * this.scale;
        this.hitbox.position.y = this.position.y + GameConfig.player.hitbox.offset.y * this.scale;
    }

    updateHurtbox() {
        this.hurtbox.position.x = this.position.x + GameConfig.player.hurtbox.offset.x * this.scale;
        this.hurtbox.position.y = this.position.y + GameConfig.player.hurtbox.offset.y * this.scale;
    }

    updateCamerabox(keys) {
        const standing    = Math.abs(this.velocity.x) < 1 && Math.abs(this.velocity.y) <= 1;
        const lookingDown = standing && keys.s.pressed;
        const lookingUp   = standing && keys.w.pressed;
        const dur = GameConfig.camera.lookDownDuration;
        const direction = lookingDown ? 1 : lookingUp ? -1 : -Math.sign(this._lookDownProgress);
        this._lookDownProgress = Math.max(-1, Math.min(1, this._lookDownProgress + direction * deltaTime / dur));

        this.camerabox.position.x = this.hitbox.position.x - this.camerabox.width / 2 + this.hitbox.width / 2;
        this.camerabox.position.y = this.hitbox.position.y - this.camerabox.height / 2 + this.hitbox.height / 2
            + this._lookDownProgress * GameConfig.camera.lookDownOffset;
        this.camerabox.velocity.x = this.velocity.x;
        this.camerabox.velocity.y = this.velocity.y;
    }

    die(type = 'default') {
        if (this.invulnerable || this.dead) { return; }
        this.lives--;
        this.dead = true;
        this.deathType = type;
        this.switchSprite("idle");
        const sound = this.deathSounds[type];
        if (sound) { gameServices.soundSystem.playWorld(sound, this.position, { broadcast: true }); }
        gameServices.cameraSystem.shake(8, 3);

        if (this.lives <= 0) {
            // No lives left — truly finished
            this.finished = true;
        } else {
            // Lives remaining — will respawn after delay
            this._respawnTimer = GameConfig.states.playing.respawnTime;
        }
        gameServices.socketHandler.sendUpdatePlayer();
    }

    _forceKill() {
        this.invulnerable = false;
        this._invulnTimer = 0;
        this.lives = 1;
        this.die();
    }

    _respawn() {
        this.dead = false;
        this.deathType = 'default';
        this.position.x = this._spawnPosition.x;
        this.position.y = this._spawnPosition.y;
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.invulnerable = true;
        this._invulnTimer = 2.0;
        this._respawnTimer = 0;
        const plural = this.lives === 1 ? 'life' : 'lives';
        gameServices.menuSystem.showHint(`${this.lives} ${plural} left`);
        clearTimeout(this._livesHintTimer);
        this._livesHintTimer = setTimeout(() => gameServices.menuSystem.hideHint(), GameConfig.states.playing.livesHintDuration * 1000);
        gameServices.socketHandler.sendUpdatePlayer();
    }


    reselectPlayer() {
        this.position.x = this.characterOption.initialPosition.x;
        this.position.y = this.characterOption.initialPosition.y;
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.loaded = false;
        this.characterOption.selected = false;
        this.characterOption._namePhase = 'hidden';
        gameServices.cameraSystem.position.x = 0;
        gameServices.cameraSystem.position.y = 0;
        gameServices.inputSystem.resetMouseListeners();
        gameServices.cursorSystem.showCursor();
        gameServices.socketHandler.sendUpdatePlayer();
    }

    updatePreviousState() {
        this.previousGrounded = this.grounded;
        this.previousVelocity.y = this.velocity.y;
    }
}
