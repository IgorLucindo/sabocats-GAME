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