// send chosed object to server
function sendChosedObjectToServer(){
    socket.emit("ON_USER_CHOOSE_OBJECT", user.placeableObject.boxId);
};



// send placed object to server
function sendPlacedObjectToServer(){
    socket.emit("ON_USER_PLACE_OBJECT", user.placeableObject);
};



// send object rotation to server
function sendObjectRotationToServer(){
    socket.emit("ON_USER_ROTATE_OBJECT", user.placeableObject);
};