// start round
function startRound(){
    placingPhase = false;
    playingPhase = true;

    background.gridLayer.loadLayer = false;
    camera.moveCamera({position: {x: 0, y: background.height - scaledCanvas.height}});
    box.objects = [];

    let randomNums = [0/3, 1/3, 2/3, 3/3];
    randomNums.sort(() => Math.random() - 0.5);
    // reset player
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.position.x =
    startArea.position.x - (player.width-player.hitbox.width)/2 + (startArea.width-player.hitbox.width)*randomNums[0];
    player.position.y =
    startArea.position.y + startArea.height - (player.height+player.hitbox.height)/2 - 5;
    player.updateHitbox();
    player.dead = false;
    player.finished = false;
    player.loaded = true;
    // reset users online players
    for(let i in users){
        if(users[i].id != user.id){
            const onlinePlayer = users[i].onlinePlayer;
            onlinePlayer.finished = false;
            onlinePlayer.loaded = true;
            const boxObject = users[i].boxObject;
            boxObject.chose = false;
            boxObject.placed = false;
        }
    };
    removeMouseEvents();
};



// finish round
function finishRound(){
    playingPhase = false;
    choosingPhase = true;
    
    user.boxObject.chose = false;
    user.boxObject.placed = false;
    for(let i in users){
        if(users[i].id != user.id){users[i].onlinePlayer.loaded = false;}
    };
    background.gridLayer.loadLayer = true;
    camera.moveCamera({middle: true});
    box = new Box({objectsNumber: 4});
    player.loaded = false;
    playersFinished = 0;
    mouse.showCursor();
    resetMouseEvents();
};



// check ending of choosing phase
function checkEndingOfChoosingPhase(){
    const numberOfPlayers = Object.keys(users).length;
    if(box.objectsChosed == numberOfPlayers){
        choosingPhase = false;
        placingPhase = true;
        box.loadBox = false;
    }
};



// check ending of placing phase
function checkEndingOfPlacingPhase(){
    const numberOfPlayers = Object.keys(users).length;
    if(box.objectsPlaced == numberOfPlayers){
        startRound();
    }
};



// check ending of round
function checkEndingOfRound({scoreBoardTimer}){
    const numberOfPlayers = Object.keys(users).length;
    if(playersFinished == numberOfPlayers){
        if(scoreBoardTime < scoreBoardTimer){
            if(scoreBoardTime == 0){
                calculatePoints();
                showScoreBoard();
            }
            scoreBoardTime += deltaTime;
        }
        else{
            clearDivMenu();
            finishRound();
            scoreBoardTime = 0;
        }
    }
};