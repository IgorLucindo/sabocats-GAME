// send position of player to server
function sendPositionToServer(){
    socket.emit("ON_USER_MOVE", {
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
function sendUnloadedPlayerToServer(){
    socket.emit("ON_USER_PLAYER_UNLOAD");
};

// send finished player to server
function sendFinishedPlayerToServer(){
    socket.emit("ON_USER_PLAYER_FINISH", player.dead);
};

// send mouse position to server
function sendMousePositionToServer(){
    socket.emit("ON_USER_MOVE_MOUSE", mouse.canvasPosition);
};

// send choose map to server
function sendChooseMapToServer(){
    socket.emit("ON_USER_CHOOSE_MAP", {chooseMap: {chose: user.chooseMap.chose, map: user.chooseMap.map}});
};

// send objects created in box of player 1 to server
function sendObjectsCreatedInBoxToServer(){
    socket.emit("ON_OBJECTS_IN_BOX_CREATED", boxObjects);
};

// send chosed object to server
function sendChosedObjectToServer(){
    socket.emit("ON_USER_CHOOSE_OBJECT", user.boxObject);
};

// send placed object to server
function sendPlacedObjectToServer(){
    socket.emit("ON_USER_PLACE_OBJECT", user.boxObject);
};