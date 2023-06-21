// detect collision between 2 objects
function collision({object1, object2}){
    return (
        object1.position.y + object1.height >= object2.position.y &&
        object1.position.y <= object2.position.y + object2.height &&
        object1.position.x <= object2.position.x + object2.width &&
        object1.position.x + object1.width >= object2.position.x
    );
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



// update users online players
function userOnlinePlayerUpdate(userTemp){
    if(userTemp.id != user.id){
        const onlinePlayer = userTemp.onlinePlayer;
        if(onlinePlayer.loaded){
            onlinePlayer.switchSprite(onlinePlayer.currentSprite);
            onlinePlayer.update();
        }
    }
};



// calculate points
function calculatePoints(){
    noPlayerDied = true;
    // if no player died, return
    for(let i in users){
        if(users[i].id != user.id && users[i].onlinePlayer.dead){
            noPlayerDied = false;
            break;
        }
    };
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



// update users cursors
function userCursorUpdate(userTemp){
    if(userTemp.id != user.id){
        const boxObject = userTemp.boxObject;
        const onlinePlayer = userTemp.onlinePlayer;
        // show other users cursor
        if(!onlinePlayer.loaded && !((boxObject.chose && !placingPhase) || (boxObject.placed && placingPhase))){
            const cursor = userTemp.cursor;
            // show object being dragged by other users cursor
            if(placingPhase){
                const object = box.objects[boxObject.boxNumber];
                cursor.gridPosition.x = Math.floor((cursor.position.x - grid.position.x)/tileSize);
                cursor.gridPosition.y = Math.floor((cursor.position.y - grid.position.y)/tileSize);
                object.followObject({object: cursor});
                if(!object.rotatable){object.draw();}
                else{object.drawRotated(object.rotation);};
                cursor.previousGridPosition.x = cursor.gridPosition.x;
                cursor.previousGridPosition.y = cursor.gridPosition.y;
            }
            cursor.update();
        }
    }
};



// rotate object
function rotateObject({object, center, rotation}){
    if(!rotation){return object;}

    const radians = rotation * (Math.PI/180);
    const cosTheta = Math.cos(radians);
    const sinTheta = Math.sin(radians);
    const translatedX = object.position.x - center.x;
    const translatedY = object.position.y - center.y;
    const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
    const rotatedY = translatedX * sinTheta + translatedY * cosTheta;

    const rotatedObject = {
        position: {x: rotatedX + center.x, y: rotatedY + center.y},
        width: object.width,
        height: object.height
    };

    switch(rotation){
        case 90:
            rotatedObject.position.x -= object.height;
            rotatedObject.width = object.height;
            rotatedObject.height = object.width;
            break;

        case 180:
            rotatedObject.position.x -= object.width;
            rotatedObject.position.y -= object.height;
            break;

        case 270:
            rotatedObject.position.y -= object.width;
            rotatedObject.width = object.height;
            rotatedObject.height = object.width;
            break;
    };
    return rotatedObject;
};



// set previous state
function setPreviousState(){
    previousTime = currentTime;
    mouse.previousGridPosition.x = mouse.gridPosition.x;
    mouse.previousGridPosition.y = mouse.gridPosition.y;
    mouse.mouse1.previousPressed = mouse.mouse1.pressed;
    keys.e.previousPressed = keys.e.pressed;
    keys.d.previousPressed = keys.d.pressed;
    keys.a.previousPressed = keys.a.pressed;
    keys.space.previousPressed = keys.space.pressed;
    if(player.loaded){
        player.previousGrounded = player.grounded;
        player.previousVelocity.y = player.velocity.y;
    }
};