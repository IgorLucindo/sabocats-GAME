// update chose map
function updateVoteUI(){
    let choseMaps = gameState.get('choseMaps');
    for(let i in choseMaps){
        const choseMap = choseMaps[i];
        if(choseMap.previousNumber != choseMap.number){voteUI(choseMap);}
        choseMap.previousNumber = choseMap.number;
    };
};



// vote map
function voteMap(chooseMap){
    let choseMaps = gameState.get('choseMaps');
    choseMaps[chooseMap.current].number++;
    if(chooseMap.previous){choseMaps[chooseMap.previous].number--;}
    else{
        let mapVotes = gameState.get('time.mapVotes');
        gameState.set('time.mapVotes', mapVotes + 1);
    }
};



// check map change
function checkMapChange({closeMapTimer, openMapTimer}){
    const numberOfPlayers = Object.keys(users).length;
    let mapVotes = gameState.get('time.mapVotes');
    if(mapVotes !== numberOfPlayers || numberOfPlayers == 0){return;}

    // Start timer if not already started
    if (!matchStateMachine.isTimerActive("mapChange") && !matchStateMachine.isTimerComplete("mapChange")) {
        matchStateMachine.startTimer("mapChange", closeMapTimer + openMapTimer);
    }

    // Get timer progress
    const timer = matchStateMachine.updateTimer("mapChange");
    if (!timer) return;

    const elapsed = timer.elapsed;

    // Fade out phase
    if(elapsed < closeMapTimer){
        if(elapsed < deltaTime){
            clearDivMenu();  // Only on first frame of this phase
        }
        fadeCanvas(Math.min(elapsed / closeMapTimer, 1));
    }
    // Fade in phase
    else if(elapsed < closeMapTimer + openMapTimer){
        if(Math.abs(elapsed - closeMapTimer) < deltaTime){
            changeMap();  // Only on first frame of this phase
        }
        const openProgress = (elapsed - closeMapTimer) / openMapTimer;
        unfadeCanvas(Math.min(openProgress, 1));
    }
    // Transition complete
    else{
        matchStateMachine.resetTimer("mapChange");
        mapVotes = 0;
        gameState.set('time.mapVotes', 0);
        // Note: match.join() will trigger server to send setState("choosing")
    }
};



// change map
function changeMap(){
    let choseMaps = gameState.get('choseMaps');
    let choseMapNumber = 0;
    let allChoseMaps = [];
    for(let i in choseMaps){
        if(choseMaps[i].number > choseMapNumber){
            choseMapNumber = choseMaps[i].number;
            allChoseMaps = [choseMaps[i].map];
        }
        else if(choseMaps[i].number == choseMapNumber){
            allChoseMaps.push(choseMaps[i].map);
        }
    };
    // sort map
    allChoseMaps.sort(() => Math.random() - 0.5);
    createMap(allChoseMaps[0]);
    match.join();
};



// create chose map
function createMap(map){
    const mapData = mapFactory.createMap(map);

    background = mapData.background;
    staticBackground = mapData.staticBackground;
    grid = mapData.grid;
    startArea = mapData.startArea;
    allCollisionBlocks = mapData.allCollisionBlocks;
    allInteractableAreas = mapData.allInteractableAreas;

    return;
};



// unload and reset map properties
function resetMapProperties(){
    gameState.set('game.inLobby', false);
    player = entityFactory.createPlayer({
        id: player.selectablePlayer.id,
        position: {x: 0, y: 0}
    });
    box = new Box({totalObjects: 4});
    camera.setPosition({key: "middle"});
    mouse.resetProperties();

    let selectablePlayers = gameState.get('objects.selectablePlayers');
    for(let i in selectablePlayers){selectablePlayers[i].selected = true;};

    let choseMaps = gameState.get('choseMaps');
    for(let i in choseMaps){choseMaps[i].number = 0;};
};