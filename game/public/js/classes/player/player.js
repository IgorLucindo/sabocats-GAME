// player class
class Player extends Sprite{
    constructor({position, scale = 1, animations, background, selectablePlayer}){
        super({imageSrc: animations.idleSit.imageSrc, frameRate: animations.idleSit.frameRate, scale});
        this.position = position;
        this.velocity = {x: 0, y: 1};
        this.previousVelocity = {x: 0, y: 0};
        this.gravityMultiplier = 1;
        this.hitbox = {
            position: {x: 0, y: 0},
            width: 33 * this.scale,
            height: 45 * this.scale
        };
        this.lastDirection = "right";
        this.lastSprite = "idleSit";

        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        };

        this.camerabox = {
            position: {x: 0, y: 0},
            velocity: {x: 0, y: 0},
            width: 901 * this.scale,
            height: 601 * this.scale
        };
        
        this.jumpEvent = false;
        this.grounded = false;
        this.previousGrounded = false;
        this.coyoteTime = null;
        this.touchingWall = {left: false, right: false};
        this.background = background;
        this.selectablePlayer = selectablePlayer;
        this.finished = false;
        this.loaded = false;
        this.dead = false;
    };



    // change to key sprite
    switchSprite(key){
        if(this.image == this.animations[key].image || !this.imageLoaded){return;}
        if(this.dead){key += "Dead"}

        this.elapsedFrames = 0;
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
        this.lastSprite = key;
    };



    // update function
    update(){
        this.position.x += Math.round(this.velocity.x/this.scale)*this.scale;
        this.updateHitbox();
        this.checkForHorizontalCollisions();
        this.applyGravity();
        this.updateHitbox();
        this.checkForVerticalCollisions();
        this.updateCamerabox();

        if(debugMode){
            c.fillStyle = "rgba(255, 0, 0, .2)";
            c.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
            c.fillStyle = "rgba(0, 255, 0, .1)";
            c.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }

        camera.panCamera({object: this.camerabox});

        if(inLobby && mouse.mouse2.pressed){this.reselectPlayer();}

        this.updateFrames();
        this.draw();
    };



    // update hitbox
    updateHitbox(){
        this.hitbox.position.x = this.position.x + 42*this.scale;
        this.hitbox.position.y = this.position.y + 24*this.scale;
    };
    // update camerabox
    updateCamerabox(){
        this.camerabox.position.x = this.hitbox.position.x - this.camerabox.width/2 + this.hitbox.width/2;
        this.camerabox.position.y = this.hitbox.position.y - this.camerabox.height/2 + this.hitbox.height/2;
        this.camerabox.velocity.x = this.velocity.x;
        this.camerabox.velocity.y = this.velocity.y;
    };



    // gravity
    applyGravity(){
        this.velocity.y += GRAVITY * this.gravityMultiplier * this.scale;
        this.position.y += this.velocity.y;
    };



    // canvas horizontal collision
    checkForHorizontalCanvasCollision(){
        if(this.hitbox.position.x + this.hitbox.width + this.velocity.x >= background.width || 
        this.hitbox.position.x + this.velocity.x <= 0){
            this.velocity.x = 0;
        }
    };
    // horizontal collision
    checkForHorizontalCollisions(){
        this.touchingWall.left = false;
        this.touchingWall.right = false;

        for(let i in allCollisionBlocks){
            const collisionBLock = allCollisionBlocks[i];
            const widerCollisionBlock = {
                position: {x: collisionBLock.position.x - 1, y: collisionBLock.position.y},
                width: collisionBLock.width + 2,
                height: collisionBLock.height
            }
            if(collision({object1: this.hitbox, object2: widerCollisionBlock})){
                if(collisionBLock.wallSlide){
                    if(this.hitbox.position.x >= collisionBLock.position.x + collisionBLock.width - 1){
                        this.touchingWall.left = true;
                    }
                    else if(this.hitbox.position.x + this.hitbox.width <= collisionBLock.position.x + 1){
                        this.touchingWall.right = true;
                    }
                }

                if(this.hitbox.position.x <= collisionBLock.position.x + collisionBLock.width &&
                   this.hitbox.position.x + this.hitbox.width >= collisionBLock.position.x){
                    if(!this.dead && collisionBLock.death){this.die();}
                    // left collision
                    if(this.velocity.x < 0){
                        this.velocity.x = 0;
                        const offset = this.hitbox.position.x - this.position.x;
                        this.position.x = collisionBLock.position.x + collisionBLock.width - offset + .01;
                        break;
                    }
                    // right collision
                    if(this.velocity.x > 0){
                        this.velocity.x = 0;
                        const offset = this.hitbox.position.x - this.position.x + this.hitbox.width;
                        this.position.x = collisionBLock.position.x - offset - .01;
                        break;
                    }
                }
            }
        };
    };
    // vertical collision
    checkForVerticalCollisions(){
        if(this.velocity.y == 0){return;}
        this.grounded = false;

        for(let i in allCollisionBlocks){
            const collisionBLock = allCollisionBlocks[i];
            if(collision({object1: this.hitbox, object2: collisionBLock})){
                if(!this.dead && collisionBLock.death){this.die();}
                // bottom collision
                if(this.velocity.y > 0){
                    this.velocity.y = 0;
                    const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
                    this.position.y = collisionBLock.position.y - offset - .01;
                    // set grounded state
                    this.grounded = true;
                    break;
                }
                // top collision
                if(this.velocity.y < 0){
                    this.velocity.y = 0;
                    const offset = this.hitbox.position.y - this.position.y;
                    this.position.y = collisionBLock.position.y + collisionBLock.height - offset + .01;
                    break;
                }
            }
        };
        // set coyote time
        if(this.velocity.y < 0){this.coyoteTime = null;}
        else if(this.grounded || this.touchingWall.right || this.touchingWall.left){this.coyoteTime = .2;}
        else{this.coyoteTime -= deltaTime;}
    };



    // kill player
    die(){
        this.dead = true;
        this.finished = true;
        this.switchSprite(this.lastSprite);
        playersFinished++;
        sendFinishedPlayerToServer();
    };



    // reselect player
    reselectPlayer(){
        this.position.x = this.selectablePlayer.inicialPosition.x;
        this.position.y = this.selectablePlayer.inicialPosition.y;
        this.loaded = false;
        this.selectablePlayer.selected = false;
        camera.position.x = 0;
        camera.position.y = 0;
        resetMouseEvents();
        mouse.showCursor();
        sendUnloadedPlayerToServer();
    };
};