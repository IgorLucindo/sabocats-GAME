import { ctx, debugMode } from '../../core/renderContext.js';
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
            width: GameConfig.player.hitboxWidth * this.scale,
            height: GameConfig.player.hitboxHeight * this.scale
        };
        this.hurtbox = {
            position: { x: 0, y: 0 },
            width: GameConfig.player.hurtboxWidth * this.scale,
            height: GameConfig.player.hurtboxHeight * this.scale
        };
        this.lastDirection = "right";

        this.camerabox = {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            width: GameConfig.player.cameraboxWidth * this.scale,
            height: GameConfig.player.cameraboxHeight * this.scale
        };

        this.jumpEvent = false;
        this.grounded = false;
        this.previousGrounded = false;
        this.jumpBufferTime = 0;
        this.coyoteTime = 0;
        this.jumped = false;
        this.walljumpedFrom = null;
        this.touchingWall = { left: false, right: false };
        this.characterOption = null;

        this.wallSlideFrame = 0;
        this.idleFrame = 0;
        this.invulnerable = false;
    }

    loadCharacter(id, animations, characterOption) {
        this._loadAnimations(animations);

        this.characterOption = characterOption;
        this.position.x = characterOption.initialPosition.x;
        this.position.y = characterOption.initialPosition.y;
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.dead = false;
        this.finished = false;
        this.coyoteTime = 0;
        this.jumpBufferTime = 0;
        this.jumped = false;
        this.walljumpedFrom = null;
        this.grounded = false;
        this.jumpEvent = false;
        this.touchingWall.left = false;
        this.touchingWall.right = false;
        this.lastDirection = "right";
        this.lastSprite = "sit";
        this.wallSlideFrame = 0;
        this.idleFrame = 0;
        this.currentFrame = 0;
        this.elapsedFrames = 0;
        this.loaded = true;
    }

    update() {
        if (!this.loaded) { return; }

        const { physicsSystem, collisionSystem, playerControlSystem, animationSystem,
                inputSystem, cameraSystem, cursorSystem, particleSystem } = gameServices;
        const keys   = inputSystem.keys;
        const blocks = collisionSystem.blocks;
        const damageBlocks = collisionSystem.damageBlocks;

        if (!this.dead && !this.finished) {
            playerControlSystem.processInput(this, keys);
        }
        physicsSystem.decelerate(this);
        physicsSystem.applyAirMovement(this);

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

        // Coyote time
        if (this.velocity.y < 0) { this.coyoteTime = 0; }
        else if (this.grounded || this.touchingWall.right || this.touchingWall.left) {
            this.coyoteTime = GameConfig.jump.coyoteTime;
        } else {
            this.coyoteTime -= deltaTime;
        }

        this.updateCamerabox();
        if (!this.dead && !this.finished) { cameraSystem.panCamera({ object: this.camerabox }); }

        if (gameState.get('game.inLobby') && cursorSystem.rightClick.pressed) {
            this.reselectPlayer();
        }

        animationSystem.updateSprite(this);
        animationSystem.updateParticles(this, keys, particleSystem);
        this.updateFrames();
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
        this.hitbox.position.x = this.position.x + GameConfig.player.hitboxOffsetX * this.scale;
        this.hitbox.position.y = this.position.y + GameConfig.player.hitboxOffsetY * this.scale;
    }

    updateHurtbox() {
        this.hurtbox.position.x = this.position.x + GameConfig.player.hurtboxOffsetX * this.scale;
        this.hurtbox.position.y = this.position.y + GameConfig.player.hurtboxOffsetY * this.scale;
    }

    updateCamerabox() {
        this.camerabox.position.x = this.hitbox.position.x - this.camerabox.width / 2 + this.hitbox.width / 2;
        this.camerabox.position.y = this.hitbox.position.y - this.camerabox.height / 2 + this.hitbox.height / 2;
        this.camerabox.velocity.x = this.velocity.x;
        this.camerabox.velocity.y = this.velocity.y;
    }

    die() {
        if (this.invulnerable) { return; }
        this.dead = true;
        this.finished = true;
        this.switchSprite("idle");
        gameServices.socketHandler.sendUpdatePlayer();
    }

    prepareForMatch(position) {
        this.position.x = position.x;
        this.position.y = position.y;
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.dead = false;
        this.finished = false;
        this.invulnerable = false;
        this.coyoteTime = 0;
        this.jumpBufferTime = 0;
        this.jumped = false;
        this.walljumpedFrom = null;
        this.grounded = false;
        this.jumpEvent = false;
        this.touchingWall.left = false;
        this.touchingWall.right = false;
        this.lastDirection = "right";
        this.lastSprite = "sit";
        this.wallSlideFrame = 0;
        this.idleFrame = 0;
        this.currentFrame = 0;
        this.elapsedFrames = 0;
        this.loaded = true;
    }

    reselectPlayer() {
        this.position.x = this.characterOption.initialPosition.x;
        this.position.y = this.characterOption.initialPosition.y;
        this.velocity.x = 0;
        this.velocity.y = 1;
        this.loaded = false;
        this.characterOption.selected = false;
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
