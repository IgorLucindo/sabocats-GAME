// send position of player to server
function sendPositionToServer(){
    socket.emit("ON_USER_MOVE", {
        id: socket.id,
        onlinePlayer: {position: player.position, currentSprite: player.lastSprite}
    });
};

// send id of selected player to server
function sendSelectedPlayerToServer(playerId, selectablePlayerId){
    socket.emit("ON_USER_SELECT_PLAYER", {
        onlinePlayer: {id: playerId, loaded: true},
        onlineSelectablePlayer: {id: selectablePlayerId}
    });
};

// send player states to server
function sendPlayerLoadedToServer(){
    socket.emit("ON_USER_PLAYER_LOADED", {onlinePlayer: {loaded: player.loaded}});
};

// send choose map to server
function sendChooseMapToServer(){
    socket.emit("ON_USER_CHOOSE_MAP", {chooseMap: {chose: user.chooseMap.chose, map: user.chooseMap.map}});
};