// send choose map to server
function sendChooseMapToServer(){
    socket.emit("ON_USER_CHOOSE_MAP", user.chooseMap);
};