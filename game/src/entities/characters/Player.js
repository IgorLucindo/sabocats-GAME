import { ctx, debugMode } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { deltaTime } from '../../core/timing.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { Sprite } from '../Sprite.js';

export class Player extends Sprite {
    constructor({ position, animations, characterOption }) {
        super({ texture: animations.idleSit.texture, frameRate: animations.idleSit.frameRate, scale: GameConfig.rendering.pixelScale });
        this.position = position;
        this.velocity = { x: 0, y: 1 };
        this.previousVelocity = { x: 0, y: 0 };
        this.gravityMultiplier = 1;
        this.hitbox = {
            position: { x: 0, y: 0 },
            width: GameConfig.player.hitboxWidth * this.scale,
            height: GameConfig.player.hitboxHeight * this.scale
        };
        this.lastDirection = "right";
        this.lastSprite = "idleSit";

        this.animations = animations;
        for (let key in this.animations) {
            const image = new Image();
            image.src = this.animations[key].texture;
            this.animations[key].image = image;
        }

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
        this.touchingWall = { left: false, right: false };
        this.characterOption = characterOption;
        this.finished = false;
        this.loaded = false;
        this.dead = false;

        this.wallSlideFrame = 0;
        this.idleFrame = 0;
    }

    switchSprite(key) {
        if (this.image === this.animations[key].image || !this.imageLoaded) { return; }
        if (this.dead) { key += "Dead"; }

        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
        this.lastSprite = key;
    }

    update() {
        const { physicsSystem, collisionSystem, playerControlSystem, animationSystem,
                inputSystem, cameraSystem, cursorSystem, particleSystem } = gameServices;
        const keys   = inputSystem.keys;
        const blocks = collisionSystem.blocks;
        const onDeathBlock = () => { if (!this.dead) this.die(); };

        this.checkForHorizontalCanvasCollision();

        if (!this.dead) { playerControlSystem.processInput(this, keys); }
        physicsSystem.decelerate(this);
        physicsSystem.applyAirMovement(this);

        // Horizontal pass
        physicsSystem.applyHorizontalVelocity(this);
        this.updateHitbox();
        collisionSystem.checkHorizontalCollisions(this, blocks, onDeathBlock);

        // Vertical pass
        physicsSystem.applyVerticalVelocity(this);
        this.updateHitbox();
        collisionSystem.checkVerticalCollisions(this, blocks, onDeathBlock);

        // Coyote time
        if (this.velocity.y < 0) { this.coyoteTime = 0; }
        else if (this.grounded || this.touchingWall.right || this.touchingWall.left) {
            this.coyoteTime = GameConfig.jump.coyoteTime;
        } else {
            this.coyoteTime -= deltaTime;
        }

        this.updateCamerabox();
        cameraSystem.panCamera({ object: this.camerabox });

        if (gameState.get('game.inLobby') && cursorSystem.rightClick.pressed) { this.reselectPlayer(); }

        animationSystem.updateSprite(this);
        animationSystem.updateParticles(this, keys, particleSystem);
    }

    render() {
        this.updateFrames();
        this.draw();

        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 0, .2)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.fillStyle = "rgba(0, 255, 0, .1)";
            ctx.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }
    }

    updateHitbox() {
        this.hitbox.position.x = this.position.x + GameConfig.player.hitboxOffsetX * this.scale;
        this.hitbox.position.y = this.position.y + GameConfig.player.hitboxOffsetY * this.scale;
    }

    updateCamerabox() {
        this.camerabox.position.x = this.hitbox.position.x - this.camerabox.width / 2 + this.hitbox.width / 2;
        this.camerabox.position.y = this.hitbox.position.y - this.camerabox.height / 2 + this.hitbox.height / 2;
        this.camerabox.velocity.x = this.velocity.x;
        this.camerabox.velocity.y = this.velocity.y;
    }

    checkForHorizontalCanvasCollision() {
        if (this.hitbox.position.x + this.hitbox.width + this.velocity.x >= gameServices.background.width ||
            this.hitbox.position.x + this.velocity.x <= 0) {
            this.velocity.x = 0;
        }
    }

    die() {
        this.dead = true;
        this.finished = true;
        this.switchSprite(this.lastSprite);
        gameServices.socketHandler.sendFinishedPlayer();
    }

    reselectPlayer() {
        this.position.x = this.characterOption.initialPosition.x;
        this.position.y = this.characterOption.initialPosition.y;
        this.loaded = false;
        this.characterOption.selected = false;
        gameServices.cameraSystem.position.x = 0;
        gameServices.cameraSystem.position.y = 0;
        gameServices.inputSystem.resetMouseListeners();
        gameServices.cursorSystem.showCursor();
        gameServices.socketHandler.sendUnloadPlayer();
    }
}
