// update chose map
function updateVoteUI(){
    for(let i in choseMaps){
        const choseMap = choseMaps[i];
        if(choseMap.previousNumber != choseMap.number){voteUI(choseMap);}
        choseMap.previousNumber = choseMap.number;
    };
};



// vote map
function voteMap(chooseMap){
    choseMaps[chooseMap.current].number++;
    if(chooseMap.previous){choseMaps[chooseMap.previous].number--;}
    else{mapVotes++;}
};



// check map change
function checkMapChange({closeMapTimer, openMapTimer}){
    const numberOfPlayers = Object.keys(users).length;
    if(mapVotes == numberOfPlayers && numberOfPlayers != 0){
        if(closeMapTime < closeMapTimer){
            if(closeMapTime == 0){clearDivMenu();}
            closeMapTime += deltaTime;
            fadeCanvas(closeMapTime/closeMapTimer);
        }
        else if(openMapTime < openMapTimer){
            if(openMapTime == 0){changeMap();}
            openMapTime += deltaTime;
            unfadeCanvas(openMapTime/openMapTimer);
        }
        else{
            mapVotes = 0;
            closeMapTime = 0;
            openMapTime = 0;
        }
    }
};



// change map
function changeMap(){
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
    resetMapProperties();
    finishRound();
};



// create chose map
function createMap(map){
    switch(map){
        case "forest":
            [
                background, staticBackground, grid,
                startArea, allCollisionBlocks, allInteractableAreas,
                playerScale, scale, tileSize
            ] = createForest();
            break;
    };
};



// unload and reset map properties
function resetMapProperties(){
    inLobby = false;
    scaledCanvas.width = canvas.width / scale;
    scaledCanvas.height = canvas.height / scale;
    player = createPlayer({
        id: player.selectablePlayer.id,
        position: {x: 0, y: 0},
        scale: playerScale
    });
    camera.setPosition({middle: true});
    mouse.resetProperties();
    for(let i in users){
        const userTemp = users[i];
        if(userTemp.id != user.id){
            userTemp.onlinePlayer.scale = playerScale;
            userTemp.onlinePlayer.width *= playerScale;
            userTemp.onlinePlayer.height *= playerScale;
            userTemp.cursor.scale = playerScale;
            userTemp.cursor.width *= playerScale;
            userTemp.cursor.height *= playerScale;
        }
    };
    for(let i in selectablePlayers){selectablePlayers[i].selected = true;};
    for(let i in choseMaps){choseMaps[i].number = 0;};
};