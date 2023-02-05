// walk event
var idleFrameCicles = 0;
function run(){
    const deceleration = DECELERATION * player.scale;
    const walkMaxVelocity = WALK_MAX_VELOCITY * player.scale;
    const walkAcceleration = (WALK_ACCELERATION + DECELERATION)*player.scale;
    const runMaxVelocity = RUN_MAX_VELOCITY * player.scale;
    const runAcceleration = (RUN_ACCELERATION + DECELERATION)*player.scale;
    // deceleration
    if(player.velocity.x > deceleration){player.velocity.x -= deceleration;}
    else if(player.velocity.x < -deceleration){player.velocity.x += deceleration;}
    else{player.velocity.x = 0;}
    // press only "d" key
    if(keys.d.pressed && !keys.a.pressed){
        if(!keys.shift.pressed){
            player.velocity.x = Math.min(player.velocity.x + walkAcceleration, walkMaxVelocity);
            if(player.grounded){player.switchSprite("walk");}
        }
        else{
            player.velocity.x = Math.min(player.velocity.x + runAcceleration, runMaxVelocity);
            if(player.grounded){player.switchSprite("run");}
        }
        player.lastDirection = "right";
        player.PanCameraLeft();
    }
    // press only "a" key
    else if(!keys.d.pressed && keys.a.pressed){
        if(!keys.shift.pressed){
            player.velocity.x = Math.max(player.velocity.x - walkAcceleration, -walkMaxVelocity);
            if(player.grounded){player.switchSprite("walkLeft");}
        }
        else{
            player.velocity.x = Math.max(player.velocity.x - runAcceleration, -runMaxVelocity);
            if(player.grounded){player.switchSprite("runLeft");}
        }
        player.lastDirection = "left";
        player.PanCameraRight();
    }
    // press or release both "a" and "d" keys
    else if(player.grounded){
        if(player.lastSprite.substring(0,4) != "idle"){idleFrameCicles = 0;}
        if(player.currentFrame == player.frameRate-1 && player.elapsedFrames % player.frameBuffer == 0){idleFrameCicles++;}

        if(player.lastDirection == "right"){
            if(idleFrameCicles < 2){player.switchSprite("idleStand");}
            else if(idleFrameCicles < 3){player.switchSprite("idleSitting");}
            else{player.switchSprite("idleSit");}
        }
        else{
            if(idleFrameCicles < 2){player.switchSprite("idleStandLeft");}
            else if(idleFrameCicles < 3){player.switchSprite("idleSittingLeft");}
            else{player.switchSprite("idleSitLeft");}
        }
    }
    player.velocity.x = Math.round(player.velocity.x*10) / 10;
    // set previous state
    keys.d.previousPressed = keys.d.pressed;
    keys.a.previousPressed = keys.a.pressed;
};

// jump event with coyote time and jump buffer
function jump(){
    if(!keys.space.previousPressed && keys.space.pressed){player.jumpBufferTime = .2;}
    else if(keys.space.pressed){player.jumpBufferTime -= deltaTime;}

    if(player.jumpBufferTime > 0 && player.coyoteTime > 0){
        player.velocity.y = -JUMP_VELOCITY * player.scale;
        if(player.touchingWall.right && !player.grounded){
            player.velocity.x = -HORIZONTAL_WALLSLIDE_JUMP_VELOCITY * player.scale;
        }
        if(player.touchingWall.left && !player.grounded){
            player.velocity.x = HORIZONTAL_WALLSLIDE_JUMP_VELOCITY * player.scale;
        }
        player.jumpBufferTime = 0;
    }
    if(!keys.space.pressed && player.velocity.y < 0){player.velocity.y /= 2;}
    // set previous state
    keys.space.previousPressed = keys.space.pressed;
};

// wall slide event
function wallSlide(){
    if(!player.grounded){
        const wallSlideVelocity = WALLSLIDE_VELOCITY * player.scale;
        if(player.touchingWall.right){
            if(player.velocity.y > wallSlideVelocity){player.velocity.y = wallSlideVelocity;}
            player.switchSprite("wallSlide");
        }
        else if(player.touchingWall.left){
            if(player.velocity.y > wallSlideVelocity){player.velocity.y = wallSlideVelocity;}
            player.switchSprite("wallSlideLeft");
        }
    }
};

// fall faster, max fall speed, bonus air time, bonus peak speed and vertical animation
function verticalMovement({peakVelocityThreshold, gravityFallMultiplier, gravityPeakMultiplier, peakSpeedMultiplier, maxFallSpeed}){
    if(player.touchingWall.right || player.touchingWall.left){
        if(player.velocity.y > 0){player.PanCameraTop();}
        else if(player.velocity.y < 0){player.PanCameraBottom();}
        return;
    }

    if(player.velocity.y < -peakVelocityThreshold * player.scale){
        gravityTemp = GRAVITY;
        if(player.lastDirection == "right"){player.switchSprite("jump");}
        else{player.switchSprite("jumpLeft");}
    }
    else if(player.velocity.y > peakVelocityThreshold * player.scale){
        gravityTemp = GRAVITY * gravityFallMultiplier;
        if(player.velocity.y > maxFallSpeed * player.scale){player.velocity.y = maxFallSpeed * player.scale;}
        if(player.lastDirection == "right"){player.switchSprite("fall");}
        else{player.switchSprite("fallLeft");}
    }
    else if(!player.grounded){
        gravityTemp = GRAVITY * gravityPeakMultiplier;
        player.velocity.x *= peakSpeedMultiplier;
        if(player.lastDirection == "right"){player.switchSprite("float");}
        else{player.switchSprite("floatLeft");}
    }

    if(player.velocity.y < 0){player.PanCameraBottom();}
    else if(player.velocity.y > 0){player.PanCameraTop();}
};



// set keyboard events
function setKeyboardEvents(){
    window.addEventListener("keydown", (event) => {
        switch(event.key){
            case "a":
                keys.a.pressed = true;
                break;

            case "A":
                keys.a.pressed = true;
                break;

            case "d":
                keys.d.pressed = true;
                break;

            case "D":
                keys.d.pressed = true;
                break;

            case "e":
                keys.e.pressed = true;
                break;

            case "E":
                keys.e.pressed = true;
                break;

            case " ":
                keys.space.pressed = true;
                break;

            case "Shift":
                keys.shift.pressed = true;
                break;
        };
    });
    window.addEventListener("keyup", (event) => {
        switch(event.key){
            case "a":
                keys.a.pressed = false;
                break;

            case "A":
                keys.a.pressed = false;
                break;

            case "d":
                keys.d.pressed = false;
                break;

            case "D":
                keys.d.pressed = false;
                break;

            case "e":
                keys.e.pressed = false;
                break;

            case "E":
                keys.e.pressed = false;
                break;

            case " ":
                keys.space.pressed = false;
                break;
                
            case "Shift":
                keys.shift.pressed = false;
                break;
        };
    });
};


// mouse events
function mouseEventsUpdate(){
    // mouse down events
    if(mouse.down){
        if(mouse.event.button == 0){mouse.mouse1.pressed = true;}
        else if(mouse.event.button == 2){
            mouse.mouse2.pressed = true;
            mouse.position.x = mouse.event.x;
            mouse.position.y = mouse.event.y;
            if(grid){
                mouse.gridPosition.x = Math.floor((mouse.position.x/scale - camera.position.x - grid.position.x)/TILE_SIZE);
                mouse.gridPosition.y = Math.floor((mouse.position.y/scale - camera.position.y - grid.position.y)/TILE_SIZE);
            }
        }
    }
    else if(mouse.event){
        if(mouse.event.button == 0){mouse.mouse1.pressed = false;}
        else if(mouse.event.button == 2){mouse.mouse2.pressed = false;}
    }
    // mouse move events
    if(mouse.move){
        mouse.position.x = mouse.event.x;
        mouse.position.y = mouse.event.y;
        if(grid){
            mouse.gridPosition.x = Math.floor((mouse.position.x/scale - camera.position.x - grid.position.x)/TILE_SIZE);
            mouse.gridPosition.y = Math.floor((mouse.position.y/scale - camera.position.y - grid.position.y)/TILE_SIZE);
        }
    }
    mouse.move = false;
};
// mouse move function
function mouseMove(event){
    mouse.move = true;
    mouse.event = event;
};
// set mouse events
function setMouseEvents(){
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mousedown", (event) => {
        mouse.down = true;
        mouse.event = event;
    });
    window.addEventListener("mouseup", (event) => {
        mouse.down = false;
        mouse.event = event;
    });
    window.addEventListener("contextmenu", (event) => {event.preventDefault()});
};
// reset mouse events
function resetMouseEvents(){
    window.addEventListener("mousemove", mouseMove);
};
// remove mouse events
function removeMouseEvents(){
    window.removeEventListener("mousemove", mouseMove);
};