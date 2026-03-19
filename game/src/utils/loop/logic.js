function logicLoop() {
    // Update input state
    inputManager.updateMouseState(camera, grid);

    // Update all interactable areas
    for(let i in allInteractableAreas) {
        allInteractableAreas[i].update();
    };

    // Update users
    for(let i in users) {
        userOnlinePlayerUpdate(users[i]);
        userCursorUpdate(users[i]);
    };

    // Update selectable players
    let selectablePlayers = gameState.get('objects.selectablePlayers');
    for(let i in selectablePlayers) {
        if(!selectablePlayers[i].selected){selectablePlayers[i].update();}
    };

    // Update player
    if(player.loaded){player.update();}

    // Update particles
    for(let i in allParticles) {
        allParticles[i].update();
    };

    // Update vote ui
    if(gameState.get('game.inLobby')) {updateVoteUI();}

    // Check map change
    checkMapChange({ closeMapTimer: 1, openMapTimer: 1 });

    // Update camera
    camera.update();

    // Run match
    if(match.inMatch) {matchLoop();}

    // Set previous state
    setPreviousState();
}