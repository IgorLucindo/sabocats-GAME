// walk event
function run(){
    const walkMaxVelocity = WALK_MAX_VELOCITY * player.scale;
    const walkAcceleration = (WALK_ACCELERATION + DECELERATION)*player.scale;
    const runMaxVelocity = RUN_MAX_VELOCITY * player.scale;
    const runAcceleration = (RUN_ACCELERATION + DECELERATION)*player.scale;
    // press only "d" key
    if(keys.d.pressed && !keys.a.pressed){
        // stop wall sliding
        if(!player.grounded){
            if(player.touchingWall.left && stopWallSlidingFrame < STOP_WALLSLIDING_TOTAL_FRAMES){
                stopWallSlidingFrame++;
                return;
            }
            else{
                stopWallSlidingFrame = 0;
                player.touchingWall.left = false;
                player.position.x++;
            }
        }
        // movement
        if(!keys.shift.pressed){
            if(player.velocity.x < walkMaxVelocity){player.velocity.x += walkAcceleration;}
            if(player.grounded){player.switchSprite("walk");}
        }
        else{
            if(player.velocity.x < runMaxVelocity){player.velocity.x += runAcceleration;}
            if(player.grounded){player.switchSprite("run");}
        }
        player.lastDirection = "right";
        // turn particle
        if(player.grounded &&
           (!keys.d.previousPressed || !keys.a.previousPressed) &&
           player.velocity.x < -walkMaxVelocity*.4){
            player.particles.playSprite("turn");
        }
    }
    // press only "a" key
    else if(!keys.d.pressed && keys.a.pressed){
        // stop wall sliding
        if(!player.grounded){
            if(player.touchingWall.right && stopWallSlidingFrame < STOP_WALLSLIDING_TOTAL_FRAMES){
                stopWallSlidingFrame++;
                return;
            }
            else{
                stopWallSlidingFrame = 0;
                player.touchingWall.right = false;
                player.position.x--;
            }
        }
        // movement
        if(!keys.shift.pressed){
            if(player.velocity.x > -walkMaxVelocity){player.velocity.x -= walkAcceleration;}
            if(player.grounded){player.switchSprite("walkLeft");}
        }
        else{
            if(player.velocity.x > -runMaxVelocity){player.velocity.x -= runAcceleration;}
            if(player.grounded){player.switchSprite("runLeft");}
        }
        player.lastDirection = "left";
        // turn particle
        if(player.grounded &&
           (!keys.d.previousPressed || !keys.a.previousPressed) &&
           player.velocity.x > walkMaxVelocity*.4){
            player.particles.playSprite("turnLeft");
        }
    }
    // press or release both "a" and "d" keys
    else if(player.grounded){
        if(player.lastSprite.substring(0,4) != "idle"){idleFrameCicles = 0;}
        if(player.currentFrame == player.frameRate-1 && player.elapsedFrames % player.frameBuffer == 0){idleFrameCicles++;}

        if(player.lastDirection == "right"){
            if(idleFrameCicles < 3){player.switchSprite("idleStand");}
            else if(idleFrameCicles < 4){player.switchSprite("idleSitting");}
            else{player.switchSprite("idleSit");}
        }
        else{
            if(idleFrameCicles < 3){player.switchSprite("idleStandLeft");}
            else if(idleFrameCicles < 4){player.switchSprite("idleSittingLeft");}
            else{player.switchSprite("idleSitLeft");}
        }
    }
};

// decelerate
function deceleration(){
    const deceleration = DECELERATION * player.scale;
    if(player.velocity.x > deceleration){player.velocity.x -= deceleration;}
    else if(player.velocity.x < -deceleration){player.velocity.x += deceleration;}
    else{player.velocity.x = 0;}
};

// jump event with coyote time and jump buffer
function jump(){
    if(!keys.space.previousPressed && keys.space.pressed){player.jumpBufferTime = .2;}
    else if(keys.space.pressed){player.jumpBufferTime -= deltaTime;}

    if(player.jumpBufferTime > 0 && player.coyoteTime > 0){
        // vertical jump
        player.velocity.y = -JUMP_VELOCITY * player.scale;
        // wall slide jump
        if((player.touchingWall.right || player.touchingWall.left) && !player.grounded){
            let horizontalWallSlideJumpVelocity = HORIZONTAL_WALLSLIDE_JUMP_VELOCITY * player.scale;
            if(keys.shift.pressed){
                horizontalWallSlideJumpVelocity = HORIZONTAL_WALLSLIDE_SPRINT_JUMP_VELOCITY * player.scale;
            }
            if(player.touchingWall.right){
                player.velocity.x = -horizontalWallSlideJumpVelocity;
                // wall slide jump particle
                player.particles.playSprite("wallSlideJump");
            }
            else if(player.touchingWall.left){
                player.velocity.x = horizontalWallSlideJumpVelocity;
                // wall slide jump particle
                player.particles.playSprite("wallSlideJumpLeft");
            }
        }
        // jump particle
        else{player.particles.playSprite("jump");}
        player.jumpBufferTime = 0;
    }
    if(!keys.space.pressed && player.velocity.y < 0){player.velocity.y /= 2;}
};

// wall slide event
function wallSlide(){
    if((player.touchingWall.right || player.touchingWall.left) && !player.grounded){
        let wallSlideVelocity = WALLSLIDE_VELOCITY * player.scale;
        if(keys.w.pressed){wallSlideVelocity *= .2;}
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
    if(player.touchingWall.right || player.touchingWall.left){return;}
    
    if(player.velocity.y < -peakVelocityThreshold * player.scale){
        gravityTemp = GRAVITY;
        if(player.lastDirection == "right"){player.switchSprite("jump");}
        else{player.switchSprite("jumpLeft");}
    }
    else if(player.velocity.y > peakVelocityThreshold * player.scale){
        gravityTemp = GRAVITY * gravityFallMultiplier;
        if(player.velocity.y > maxFallSpeed * player.scale){
            player.velocity.y = maxFallSpeed * player.scale;
        }
        if(player.lastDirection == "right"){player.switchSprite("fall");}
        else{player.switchSprite("fallLeft");}
    }
    else if(!player.grounded){
        gravityTemp = GRAVITY * gravityPeakMultiplier;
        player.velocity.x *= peakSpeedMultiplier;
        if(player.lastDirection == "right"){player.switchSprite("float");}
        else{player.switchSprite("floatLeft");}
    }
    // fall particle
    if(!player.previousGrounded && player.grounded &&
       player.previousVelocity.y > maxFallSpeed*player.scale*.7){
        player.particles.playSprite("fall");
    }
};



// set keyboard events
function setKeyboardEvents(){
    window.addEventListener("keydown", (event) => {
        switch(event.key){
            case "w":
                keys.w.pressed = true;
                break;

            case "W":
                keys.w.pressed = true;
                break;

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

            case "r":
                keys.r.pressed = true;
                break;

            case "R":
                keys.r.pressed = true;
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
            case "w":
                keys.w.pressed = false;
                break;

            case "W":
                keys.w.pressed = false;
                break;

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

            case "r":
                keys.r.pressed = false;
                break;

            case "R":
                keys.r.pressed = false;
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
            mouse.canvasPosition.x = mouse.event.x/scale - camera.position.x;
            mouse.canvasPosition.y = mouse.event.y/scale - camera.position.y;
            if(grid){
                mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/tileSize);
                mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/tileSize);
            }
        }
    }
    else if(mouse.event){
        if(mouse.event.button == 0){mouse.mouse1.pressed = false;}
        else if(mouse.event.button == 2){mouse.mouse2.pressed = false;}
    }
    // mouse move events
    if(mouse.move || camera.move){
        mouse.canvasPosition.x = mouse.event.x/scale - camera.position.x;
        mouse.canvasPosition.y = mouse.event.y/scale - camera.position.y;
        if(grid){
            mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/tileSize);
            mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/tileSize);
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