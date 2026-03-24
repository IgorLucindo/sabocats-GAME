import { ctx, debugMode } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { deltaTime } from '../../core/timing.js';
import { gameServices } from '../../core/GameServices.js';
import { collision, lerp } from '../../helpers.js';
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
        };

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
    };

    // change to key sprite
    switchSprite(key) {
        if (this.image == this.animations[key].image || !this.imageLoaded) { return; }
        if (this.dead) { key += "Dead"; }

        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
        this.lastSprite = key;
    };

    // update
    update() {
        this.checkForHorizontalCanvasCollision();
        if (!this.dead) { this.controlPlayer(); }
        this.deceleratePlayer();
        this.airMovement();
        this.updatePositionHitboxCollision();
        this.updateCamerabox();

        gameServices.cameraSystem.panCamera({ object: this.camerabox });

        if (gameState.get('game.inLobby') && gameServices.cursorSystem.rightClick.pressed) { this.reselectPlayer(); }

        this.updateSprite();
        this.updateParticles();
    };

    // render
    render() {
        this.updateFrames();
        this.draw();

        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 0, .2)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            ctx.fillStyle = "rgba(0, 255, 0, .1)";
            ctx.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }
    };

    // update position and collision
    updatePositionHitboxCollision() {
        this.updateHorizontalPosition();
        this.updateHitbox();
        this.checkForHorizontalCollisions();
        this.updateVerticalPosition();
        this.updateHitbox();
        this.checkForVerticalCollisions();
    };

    // update horizontal position
    updateHorizontalPosition() {
        const tickrateCorrection = 60 * deltaTime;
        this.position.x += Math.round(this.velocity.x / this.scale) * this.scale * tickrateCorrection;
    };

    // update vertical position
    updateVerticalPosition() {
        const tickrateCorrection = 60 * deltaTime;
        this.velocity.y += GameConfig.physics.gravity * this.gravityMultiplier * tickrateCorrection * this.scale;
        this.position.y += this.velocity.y * tickrateCorrection;
    };

    // update hitbox
    updateHitbox() {
        this.hitbox.position.x = this.position.x + GameConfig.player.hitboxOffsetX * this.scale;
        this.hitbox.position.y = this.position.y + GameConfig.player.hitboxOffsetY * this.scale;
    };

    // update camerabox
    updateCamerabox() {
        this.camerabox.position.x = this.hitbox.position.x - this.camerabox.width / 2 + this.hitbox.width / 2;
        this.camerabox.position.y = this.hitbox.position.y - this.camerabox.height / 2 + this.hitbox.height / 2;
        this.camerabox.velocity.x = this.velocity.x;
        this.camerabox.velocity.y = this.velocity.y;
    };

    // canvas horizontal collision
    checkForHorizontalCanvasCollision() {
        if (this.hitbox.position.x + this.hitbox.width + this.velocity.x >= gameServices.background.width ||
            this.hitbox.position.x + this.velocity.x <= 0) {
            this.velocity.x = 0;
        }
    };

    // horizontal collision
    checkForHorizontalCollisions() {
        this.touchingWall.left = false;
        this.touchingWall.right = false;

        for (let i in gameServices.collisionSystem.blocks) {
            const collisionBlock = gameServices.collisionSystem.blocks[i];
            const widerCollisionBlock = {
                position: { x: collisionBlock.position.x - 1, y: collisionBlock.position.y },
                width: collisionBlock.width + 2,
                height: collisionBlock.height
            };
            if (collision({ object1: this.hitbox, object2: widerCollisionBlock })) {
                if (collisionBlock.wallSlide) {
                    if (this.hitbox.position.x >= collisionBlock.position.x + collisionBlock.width - 1) {
                        this.touchingWall.left = true;
                    } else if (this.hitbox.position.x + this.hitbox.width <= collisionBlock.position.x + 1) {
                        this.touchingWall.right = true;
                    }
                }

                if (this.hitbox.position.x <= collisionBlock.position.x + collisionBlock.width &&
                    this.hitbox.position.x + this.hitbox.width >= collisionBlock.position.x) {
                    if (!this.dead && collisionBlock.death) { this.die(); }
                    if (this.velocity.x < 0) {
                        this.velocity.x = 0;
                        const offset = this.hitbox.position.x - this.position.x;
                        this.position.x = collisionBlock.position.x + collisionBlock.width - offset + .01;
                        break;
                    }
                    if (this.velocity.x > 0) {
                        this.velocity.x = 0;
                        const offset = this.hitbox.position.x - this.position.x + this.hitbox.width;
                        this.position.x = collisionBlock.position.x - offset - .01;
                        break;
                    }
                }
            }
        };
    };

    // vertical collision
    checkForVerticalCollisions() {
        this.grounded = false;

        for (let i in gameServices.collisionSystem.blocks) {
            const collisionBlock = gameServices.collisionSystem.blocks[i];
            if (collision({ object1: this.hitbox, object2: collisionBlock })) {
                if (!this.dead && collisionBlock.death) { this.die(); }
                if (this.velocity.y > 0) {
                    this.velocity.y = 0;
                    const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
                    this.position.y = collisionBlock.position.y - offset - .01;
                    this.grounded = true;
                    break;
                }
                if (this.velocity.y < 0) {
                    this.velocity.y = 0;
                    const offset = this.hitbox.position.y - this.position.y;
                    this.position.y = collisionBlock.position.y + collisionBlock.height - offset + .01;
                    break;
                }
            }
        };

        if (this.velocity.y < 0) { this.coyoteTime = 0; }
        else if (this.grounded || this.touchingWall.right || this.touchingWall.left) { this.coyoteTime = GameConfig.jump.coyoteTime; }
        else { this.coyoteTime -= deltaTime; }
    };

    // kill player
    die() {
        this.dead = true;
        this.finished = true;
        this.switchSprite(this.lastSprite);
        gameServices.socketHandler.sendFinishedPlayer();
    };

    // reselect player
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
    };

    // run movement
    run() {
        const keys = gameServices.inputSystem.keys;
        const walkMaxVelocity = GameConfig.movement.walk.maxVelocity * this.scale;
        const walkAcceleration = (GameConfig.movement.walk.acceleration + GameConfig.movement.deceleration) * this.scale;
        const runMaxVelocity = GameConfig.movement.run.maxVelocity * this.scale;
        const runAcceleration = (GameConfig.movement.run.acceleration + GameConfig.movement.deceleration) * this.scale;

        if (keys.d.pressed && !keys.a.pressed) {
            if (!this.grounded) {
                if (this.touchingWall.left && this.wallSlideFrame < GameConfig.jump.stopWallSlidingFrames) {
                    this.wallSlideFrame++;
                    return;
                } else {
                    this.wallSlideFrame = 0;
                    this.touchingWall.left = false;
                    this.position.x++;
                }
            }
            if (!keys.shift.pressed) {
                this.velocity.x = Math.min(this.velocity.x + walkAcceleration, walkMaxVelocity);
            } else {
                this.velocity.x = Math.min(this.velocity.x + runAcceleration, runMaxVelocity);
            }
            this.lastDirection = "right";
        } else if (!keys.d.pressed && keys.a.pressed) {
            if (!this.grounded) {
                if (this.touchingWall.right && this.wallSlideFrame < GameConfig.jump.stopWallSlidingFrames) {
                    this.wallSlideFrame++;
                    return;
                } else {
                    this.wallSlideFrame = 0;
                    this.touchingWall.right = false;
                    this.position.x--;
                }
            }
            if (!keys.shift.pressed) {
                this.velocity.x = Math.max(this.velocity.x - walkAcceleration, -walkMaxVelocity);
            } else {
                this.velocity.x = Math.max(this.velocity.x - runAcceleration, -runMaxVelocity);
            }
            this.lastDirection = "left";
        }
    };

    // jump with coyote time and jump buffer
    jump() {
        const keys = gameServices.inputSystem.keys;
        this.jumped = false;

        if (!keys.space.previousPressed && keys.space.pressed) { this.jumpBufferTime = GameConfig.jump.jumpBuffer; }
        else if (keys.space.pressed) { this.jumpBufferTime -= deltaTime; }

        if (this.jumpBufferTime > 0 && this.coyoteTime > 0) {
            this.jumped = true;
            this.jumpBufferTime = 0;

            this.velocity.y = -GameConfig.jump.jumpVelocity * this.scale;

            if ((this.touchingWall.right || this.touchingWall.left) && !this.grounded) {
                let horizontalWallSlideJumpVelocity = GameConfig.jump.wallSlideJumpVelocity * this.scale;
                if (keys.shift.pressed) {
                    horizontalWallSlideJumpVelocity = GameConfig.jump.wallSlideSprintJumpVelocity * this.scale;
                }
                if (this.touchingWall.right) {
                    this.velocity.x = -horizontalWallSlideJumpVelocity;
                } else if (this.touchingWall.left) {
                    this.velocity.x = horizontalWallSlideJumpVelocity;
                }
            }
        }
        if (!keys.space.pressed && this.velocity.y < 0) { this.velocity.y /= 2; }
    };

    // wall slide movement
    wallSlide() {
        const keys = gameServices.inputSystem.keys;
        if (!this.grounded) {
            let wallSlideVelocity = GameConfig.jump.wallSlideVelocity * this.scale;
            if (keys.w.pressed) { wallSlideVelocity *= .2; }

            if (this.touchingWall.right) {
                if (this.velocity.y > wallSlideVelocity) { this.velocity.y = wallSlideVelocity; }
                this.lastDirection = "left";
            } else if (this.touchingWall.left) {
                if (this.velocity.y > wallSlideVelocity) { this.velocity.y = wallSlideVelocity; }
                this.lastDirection = "right";
            }
        }
    };

    // player movement controls
    controlPlayer() {
        this.run();
        this.jump();
        this.wallSlide();
    };

    // fall faster, max fall speed, bonus air time, bonus peak speed
    airMovement() {
        if (this.touchingWall.right || this.touchingWall.left) { return; }

        if (this.velocity.y < -GameConfig.physics.peakVelocityThreshold * this.scale) {
            this.gravityMultiplier = 1;
        } else if (this.velocity.y > GameConfig.physics.peakVelocityThreshold * this.scale) {
            this.gravityMultiplier = GameConfig.physics.gravityFallMultiplier;
            this.velocity.y = Math.min(this.velocity.y, GameConfig.physics.maxFallSpeed * this.scale);
        } else if (!this.grounded) {
            this.gravityMultiplier = GameConfig.physics.gravityPeakMultiplier;
            this.velocity.x *= GameConfig.movement.peakSpeedMultiplier;
        }
    };

    // decelerate
    deceleratePlayer() {
        const deceleration = GameConfig.movement.deceleration * this.scale;
        if (this.velocity.x > deceleration) { this.velocity.x -= deceleration; }
        else if (this.velocity.x < -deceleration) { this.velocity.x += deceleration; }
        else { this.velocity.x = 0; }
    };

    // change sprites
    updateSprite() {
        const walkMaxVelocity = GameConfig.movement.walk.maxVelocity * this.scale;

        if (this.grounded) {
            if (this.velocity.x > 0) {
                if (this.velocity.x <= walkMaxVelocity) { this.switchSprite("walk"); }
                else { this.switchSprite("run"); }
            } else if (this.velocity.x < 0) {
                if (this.velocity.x >= -walkMaxVelocity) { this.switchSprite("walkLeft"); }
                else { this.switchSprite("runLeft"); }
            } else {
                if (this.lastSprite.substring(0, 4) != "idle") { this.idleFrame = 0; }
                else if (this.currentFrame == this.frameRate - 1 && this.elapsedFrames % this.frameBuffer == 0) { this.idleFrame++; }

                if (this.lastDirection == "right") {
                    if (this.idleFrame < 3) { this.switchSprite("idleStand"); }
                    else if (this.idleFrame < 4) { this.switchSprite("idleSitting"); }
                    else { this.switchSprite("idleSit"); }
                } else {
                    if (this.idleFrame < 3) { this.switchSprite("idleStandLeft"); }
                    else if (this.idleFrame < 4) { this.switchSprite("idleSittingLeft"); }
                    else { this.switchSprite("idleSitLeft"); }
                }
            }
        } else {
            if (this.touchingWall.right) { this.switchSprite("wallSlide"); }
            else if (this.touchingWall.left) { this.switchSprite("wallSlideLeft"); }
            else {
                if (this.velocity.y < -GameConfig.physics.peakVelocityThreshold * this.scale) {
                    if (this.lastDirection == "right") { this.switchSprite("jump"); }
                    else { this.switchSprite("jumpLeft"); }
                } else if (this.velocity.y > GameConfig.physics.peakVelocityThreshold * this.scale) {
                    if (this.lastDirection == "right") { this.switchSprite("fall"); }
                    else { this.switchSprite("fallLeft"); }
                } else if (!this.grounded) {
                    if (this.lastDirection == "right") { this.switchSprite("float"); }
                    else { this.switchSprite("floatLeft"); }
                } else if (this.dead) {
                    if (this.lastDirection == "right") { this.switchSprite("idleStand"); }
                    else { this.switchSprite("idleStandLeft"); }
                }
            }
        }
    };

    // create particle effects
    updateParticles() {
        const keys = gameServices.inputSystem.keys;
        const walkMaxVelocity = GameConfig.movement.walk.maxVelocity * this.scale;

        if (this.grounded) {
            if (this.velocity.x < -walkMaxVelocity * .4 && keys.d.pressed && !keys.d.previousPressed) {
                gameServices.particleSystem.add("turn", this);
            } else if (this.velocity.x > walkMaxVelocity * .4 && keys.a.pressed && !keys.a.previousPressed) {
                gameServices.particleSystem.add("turnLeft", this);
            }
        } else {
            if (this.jumped) {
                if (this.touchingWall.right) { gameServices.particleSystem.add("wallSlideJump", this); }
                else if (this.touchingWall.left) { gameServices.particleSystem.add("wallSlideJumpLeft", this); }
                else { gameServices.particleSystem.add("jump", this); }
            }
        }

        if (!this.previousGrounded && this.grounded &&
            this.previousVelocity.y > GameConfig.physics.maxFallSpeed * this.scale * .7) {
            gameServices.particleSystem.add("fall", this);
        }
    };
};
