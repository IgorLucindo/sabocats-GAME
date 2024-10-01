// send join match message to server
function sendJoinMatchToServer(){
    socket.emit("ON_USER_JOIN_MATCH");
};



// send change match state messsage to server
function sendChangeStateToServer(state){
    socket.emit("ON_USER_CHANGE_MATCH_STATE", state);
};