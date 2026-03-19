// detect collision between 2 objects
function collision({object1, object2}){
    return (
        object1.position.y + object1.height >= object2.position.y &&
        object1.position.y <= object2.position.y + object2.height &&
        object1.position.x <= object2.position.x + object2.width &&
        object1.position.x + object1.width >= object2.position.x
    );
};



// linear interpolation
function lerp(currentValue, destinationValue, time){
    return currentValue*(1-time) + destinationValue*time;
};



// detect if mouse is over object
function mouseOverObject({object}){
    return (
        object.position.x <= mouse.canvasPosition.x &&
        object.position.x + object.width>= mouse.canvasPosition.x &&
        object.position.y <= mouse.canvasPosition.y &&
        object.position.y + object.height >= mouse.canvasPosition.y
    );
};



// update online players
function userOnlinePlayerUpdate(userTemp){
    if(userTemp.id == user.id){return;}

    const onlinePlayer = userTemp.onlinePlayer;
    if(onlinePlayer.loaded){
        onlinePlayer.switchSprite(onlinePlayer.currentSprite);
    }
};
// render online players
function userOnlinePlayerRender(userTemp){
    if(userTemp.id == user.id){return;}

    const onlinePlayer = userTemp.onlinePlayer;
    if(onlinePlayer.loaded){
        onlinePlayer.render();
    }
};



// add particle to allParticles
function addParticle(key){
    const particle = entityFactory.createParticle(key);
    particle.setPosition();

    let allParticles = gameState.get('objects.allParticles');
    const maxParticles = GameConfig.particles.maxParticles;
    for(let i = 0; i < maxParticles; i++){
        if(!allParticles[i]){
            particle.idNumber = i;
            allParticles[i] = particle;
            gameState.set('objects.allParticles', allParticles);
            return;
        }
    };
};



// calculate points
function calculatePoints(){
    let noPlayerDied = true;
    // if no player died, return
    for(let i in users){
        if(users[i].id != user.id && users[i].onlinePlayer.dead){
            noPlayerDied = false;
            break;
        }
    };
    gameState.set('game.noPlayerDied', noPlayerDied);
    if(noPlayerDied && !player.dead){return;}
    else{
        noPlayerDied = false;
        for(let i in users){
            if(users[i].id != user.id && !users[i].onlinePlayer.dead){
                users[i].points.victories++;
            }
        };
        if(!player.dead){user.points.victories++;}
    }
};



// Check if a user cursor should be visible
// Cursor shows when:
// 1. Player is not loaded yet, AND
// 2. Not in playing state, AND
// 3. Object is being selected/placed (chose in choosing OR placed in placing)
function shouldShowUserCursor(userTemp) {
  if (!userTemp.onlinePlayer || !userTemp.boxObject) {
    return false;
  }

  const { onlinePlayer, boxObject } = userTemp;
  const currentState = matchStateMachine.getState();

  // Hide if player already loaded
  if (onlinePlayer.loaded) {
    return false;
  }

  // Hide if in playing state
  if (currentState === "playing") {
    return false;
  }

  // Show if object is being selected in choosing
  if (currentState === "choosing" && boxObject.chose) {
    return true;
  }

  // Show if object is being placed in placing
  if (currentState === "placing" && boxObject.placed) {
    return true;
  }

  return false;
}

// update users cursors
function userCursorUpdate(userTemp){
    if(userTemp.id != user.id){
        const boxObject = userTemp.boxObject;
        const onlinePlayer = userTemp.onlinePlayer;

        // Show other users cursor if conditions are met
        if(shouldShowUserCursor(userTemp)){
            const cursor = userTemp.cursor;

            // Drag object by cursor during placing phase
            if(matchStateMachine.getState() === "placing"){
                const object = box.objects[boxObject.boxId];
                cursor.gridPosition.x = Math.floor((cursor.position.x - grid.position.x)/properties.tileSize);
                cursor.gridPosition.y = Math.floor((cursor.position.y - grid.position.y)/properties.tileSize);
                object.followObject({object: cursor});
                cursor.previousGridPosition.x = cursor.gridPosition.x;
                cursor.previousGridPosition.y = cursor.gridPosition.y;
            }
        }
    }
};



// render users cursors
function userCursorRender(userTemp){
    if(userTemp.id != user.id){
        const boxObject = userTemp.boxObject;
        const onlinePlayer = userTemp.onlinePlayer;
        // show other users cursor
        if(!onlinePlayer.loaded && !match.state === "playing" && !((boxObject.chose && match.state === "choosing") || (boxObject.placed && match.state === "placing"))){
            const cursor = userTemp.cursor;
            cursor.render();
        }
    }
};



// rotate object 90 degrees
function rotate90deg({object, center}){
    const rotatedX = -(object.position.y - center.y) + center.x;
    const rotatedY = (object.position.x - center.x) + center.y;

    const rotatedObject = {
        position: {x: rotatedX - object.height, y: rotatedY},
        width: object.height,
        height: object.width
    };
    return rotatedObject;
};



// correct deltaTime depending on inactive time
function correctDeltaTimeOnInactiveTime(){
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            previousTime = performance.now();
        }
    });
};



// set previous state
function setPreviousState(){
    // Update input manager previous state
    inputManager.updatePreviousState();

    // Update player state
    if(player.loaded){
        player.previousGrounded = player.grounded;
        player.previousVelocity.y = player.velocity.y;
    }

    // Update match state
    match.previousState = match.state;
};