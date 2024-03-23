// send join match confirmation to server
function sendJoinMatchToServer(){
    socket.emit("ON_USER_JOIN_MATCH");
};



// send match state to server
function sendMatchStateToServer(){
    socket.emit("ON_CHANGE_MATCH_STATE", match.state);
};