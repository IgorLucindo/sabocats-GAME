// send chosed object to server
function sendChosedObjectToServer(){
    socket.emit("ON_USER_CHOOSE_OBJECT", user.boxObject.boxId);
};



// send placed object to server
function sendPlacedObjectToServer(){
    socket.emit("ON_USER_PLACE_OBJECT", user.boxObject);
};



// send object rotation to server
function sendObjectRotationToServer(){
    socket.emit("ON_USER_ROTATE_OBJECT", user.boxObject);
};