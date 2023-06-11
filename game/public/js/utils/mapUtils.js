// update chose map
function choseMapUpdate(){
    // reset chose maps numbers
    for(let i in choseMaps){choseMaps[i].number = 0;};
    var allChoseMap = true;
    // set chose maps
    if(user.chooseMap.chose){choseMaps[user.chooseMap.map].number = 1;}
    else{allChoseMap = false;}
    for(let i in users){
        if(users[i].id != user.id){
            const chooseMap = users[i].chooseMap;
            if(chooseMap.chose){
                if(choseMaps[chooseMap.map]){choseMaps[chooseMap.map].number++;}
                else{choseMaps[chooseMap.map].number = 1;}
            }
            else{allChoseMap = false;}
        }
    }
    // update chose maps
    for(let i in choseMaps){
        chooseMapUpdate({
            map: choseMaps[i].map,
            number: choseMaps[i].number,
            previousNumber: choseMaps[i].previousNumber
        });
        choseMaps[i].previousNumber = choseMaps[i].number;
    };
    if(allChoseMap){changeMap();}
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
    clearMenuContainer();
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
                playerScale, scale, TILE_SIZE
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
    for(let i in users){
        if(users[i].id != user.id){
            users[i].onlinePlayer.scale = playerScale;
            users[i].onlinePlayer.width *= playerScale;
            users[i].onlinePlayer.height *= playerScale;
            users[i].cursor.scale = playerScale;
            users[i].cursor.width *= playerScale;
            users[i].cursor.height *= playerScale;
        }
    };
    for(let i in selectablePlayers){selectablePlayers[i].selected = true;};
    for(let i in choseMaps){choseMaps[i].number = 0;};
};