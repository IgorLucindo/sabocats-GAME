// game loop
function gameloop(){
    // set the delta time
    currentTime = performance.now();
    deltaTime = (currentTime - previousTime)/1000;
    previousTime = currentTime;

    // get mouse events
    mouseEventsUpdate();

    // update all interactable areas
    for(let i in allInteractableAreas){
        allInteractableAreas[i].update();
    };

    // update users
    for(let i in users){
        userOnlinePlayerUpdate(users[i]);
        userCursorUpdate(users[i]);
    };

    // update selectable players
    for(let i in selectablePlayers){
        if(!selectablePlayers[i].selected){selectablePlayers[i].update();}
    };

    // update player
    if(player.loaded){player.update();}

    // update particles
    for(let i in allParticles){
        allParticles[i].update();
    };

    // update vote ui
    if(inLobby){updateVoteUI();}

    // check map change
    checkMapChange({closeMapTimer: 1, openMapTimer: 1});

    // update camera
    camera.update();

    // run match
    if(match.inMatch){matchloop();}

    // send data to server
    sendToServer();

    // set previous state
    setPreviousState();

    requestAnimationFrame(gameloop);
};