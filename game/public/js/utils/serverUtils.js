// send player and cursor position to server
function sendPlayerAndCursorPositionToServer(){
    socket.emit("ON_USER", {
        onlinePlayer: {position: player.position, currentSprite: player.lastSprite},
        cursor: {position: mouse.canvasPosition}
    });
};

// send id of selected player to server
function sendSelectedPlayerToServer(playerId, selectablePlayerId){
    socket.emit("ON_USER_CHOOSE_PLAYER", {
        onlinePlayer: {id: playerId},
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

// send choose map to server
function sendChooseMapToServer(){
    socket.emit("ON_USER_CHOOSE_MAP", user.chooseMap);
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

// send object rotation to server
function sendObjectRotationToServer(){
    socket.emit("ON_USER_ROTATE_OBJECT", user.boxObject);
};