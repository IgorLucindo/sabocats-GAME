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

    if(time1 < closeMapTimer){
        if(time1 === 0){clearDivMenu();}
        time1 += deltaTime;
        gameState.set('time.time1', time1);
        fadeCanvas(time1/closeMapTimer);
    }
    else if(time2 < openMapTimer){
        if(time2 === 0){changeMap();}
        time2 += deltaTime;
        gameState.set('time.time2', time2);
        unfadeCanvas(time2/openMapTimer);
    }
    else{
        mapVotes = 0;
        time1 = 0;
        time2 = 0;
        gameState.set('time.mapVotes', 0);
        gameState.set('time.time1', 0);
        gameState.set('time.time2', 0);
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