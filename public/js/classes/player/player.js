// player class
class Player extends Sprite{
    constructor({position, collisionBlocks, imageSrc, frameRate, scale = .1, animations, background, selectablePlayer}){
        super({imageSrc, frameRate, scale});
        this.position = position;
        this.velocity = {x: 0, y: 1};
        this.collisionBlocks = collisionBlocks;
        this.hitbox = {
            position: {x: 0, y: 0},
            width: 195 * this.scale,
            height: 200 * this.scale
        };
        this.lastDirection = "right";

        this.animations = animations;
        for(let key in this.animations){
            const image = new Image();
            image.src = this.animations[key].imageSrc;
            this.animations[key].image = image;
        };

        this.camerabox = {
            position: {x: 0, y: 0},
            width: 3000 * this.scale,
            height: 1600 * this.scale
        };
        
        this.jumpEvent = false;
        this.grounded = false;
        this.coyoteTime = null;
        this.touchingWall = null;
        this.background = background;
        this.selectablePlayer = selectablePlayer;
        this.finished = false;
        this.loaded = false;
        this.lastSprite = "idleSit";
    };

    switchSprite(key){
        if(this.image == this.animations[key].image || !this.imageLoaded){return;}
        this.currentFrame = 0;
        this.image = this.animations[key].image;
        this.frameRate = this.animations[key].frameRate;
        this.frameBuffer = this.animations[key].frameBuffer;
        this.lastSprite = key;
    };



    // update function
    update(){
        this.updateFrames();
        this.updateCamerabox();

        c.fillStyle = "rgba(255, 0, 0, .2)";
        c.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        c.fillStyle = "rgba(0, 255, 0, .1)";
        c.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        this.draw();

        this.position.x += this.velocity.x;
        this.updateHitbox();
        this.checkForHorizontalCollisions();
        this.applyGravity();
        this.updateHitbox();
        this.checkForVerticalCollisions();

        if(inLobby && mouse.mouse2.pressed){this.reselectPlayer();}
        if(!inLobby && !this.finished && collision({object1: this.hitbox, object2: finishArea})){
            this.finished = true;
            // last finished player finishs round
            if(checkAllPlayersFinished()){finishRound();}
        }
    };



    // update hitbox
    updateHitbox(){
        this.hitbox.position = {x: this.position.x + 210*this.scale, y: this.position.y + 150*this.scale};
    };
    // update camerabox
    updateCamerabox(){
        this.camerabox.position = {
            x: this.hitbox.position.x - this.camerabox.width/2 + this.hitbox.width/2,
            y: this.hitbox.position.y - this.camerabox.height/2 + this.hitbox.height/2
        };
    };



    // gravity
    applyGravity(){
        this.velocity.y += gravityTemp * this.scale;
        this.position.y += this.velocity.y;
    };



    // pan camera functions
    PanCameraLeft(){
        const cameraboxRightSide = this.camerabox.position.x + this.camerabox.width;

        if(cameraboxRightSide >= background.width){return;}
        if(cameraboxRightSide >= scaledCanvas.width + Math.abs(camera.position.x)){
            camera.position.x = Math.round(camera.position.x - this.velocity.x);
        }
    };
    PanCameraRight(){
        const cameraboxLeftSide = this.camerabox.position.x;

        if(cameraboxLeftSide <= 0){return;}
        if(cameraboxLeftSide <= Math.abs(camera.position.x)){
            camera.position.x = Math.round(camera.position.x - this.velocity.x);
        }
    };
    PanCameraTop(){
        const cameraboxTopSide = this.camerabox.position.y + this.camerabox.height;

        if(cameraboxTopSide + this.velocity.y >= background.height){return;}
        if(cameraboxTopSide >= scaledCanvas.height + Math.abs(camera.position.y)){
            camera.position.y = Math.round(camera.position.y - this.velocity.y);
        }
    };
    PanCameraBottom(){
        const cameraboxBottomSide = this.camerabox.position.y;

        if(cameraboxBottomSide + this.velocity.y <= 0){return;}
        if(cameraboxBottomSide <= Math.abs(camera.position.y)){
            camera.position.y = Math.round(camera.position.y - this.velocity.y);
        }
    };



    // canvas horizontal collision
    checkForHorizontalCanvasCollision(){
        if(this.hitbox.position.x + this.hitbox.width + this.velocity.x >= background.width || 
        this.hitbox.position.x + this.velocity.x <= 0){
            this.velocity.x = 0;
        }
    };
    // vertical collision
    checkForHorizontalCollisions(){
        this.touchingWall = {left: false, right: false};

        for(let i = 0; i < this.collisionBlocks.length; i++){
            const collisionBLock = this.collisionBlocks[i];
            if(collision({object1: this.hitbox, object2: collisionBLock})){
                if(this.velocity.x > 0){
                    this.velocity.x = 0;
                    const offset = this.hitbox.position.x - this.position.x + this.hitbox.width;
                    this.position.x = collisionBLock.position.x - offset - .01;
                    // set touchingWall state
                    this.touchingWall.right = true;
                    break;
                }
                if(this.velocity.x < 0){
                    this.velocity.x = 0;
                    const offset = this.hitbox.position.x - this.position.x;
                    this.position.x = collisionBLock.position.x + collisionBLock.width - offset + .01;
                    // set touchingWall state
                    this.touchingWall.left = true;
                    break;
                }
            }
        };
    };
    // horizontal collision
    checkForVerticalCollisions(){
        this.grounded = false;

        for(let i = 0; i < this.collisionBlocks.length; i++){
            const collisionBLock = this.collisionBlocks[i];
            if(collision({object1: this.hitbox, object2: collisionBLock})){
                if(this.velocity.y > 0){
                    this.velocity.y = 0;
                    const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
                    this.position.y = collisionBLock.position.y - offset - .01;
                    // set grounded state
                    this.grounded = true;
                    break;
                }
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



    // reselect player
    reselectPlayer(){
        this.position.x = this.selectablePlayer.inicialPosition.x;
        this.position.y = this.selectablePlayer.inicialPosition.y;
        this.loaded = false;
        this.selectablePlayer.selected = false;
        camera.position.x = 0;
        camera.position.y = 0;
        resetMouseEvents();
        sendPlayerLoadedToServer();
    };
};