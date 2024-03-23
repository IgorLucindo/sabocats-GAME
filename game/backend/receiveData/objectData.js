// user choose object event
function onChooseObject({socket, users}){
    socket.on("ON_USER_CHOOSE_OBJECT", (updatedBoxObjectId) => {
        const user = users[socket.id];
        user.boxObject.chose = true;
        const updatedUserIDAndBoxObjectId = [user.id, updatedBoxObjectId];
        socket.broadcast.emit("ON_USER_CHOOSE_OBJECT_UPDATE", JSON.stringify(updatedUserIDAndBoxObjectId));
    });
};



// user place object event
function onPlaceObject({socket, users}){
    socket.on("ON_USER_PLACE_OBJECT", (updatedBoxObject) => {
        const user = users[socket.id];
        user.boxObject = updatedBoxObject;
        const updatedUser = {id: user.id, boxObject: updatedBoxObject};
        socket.broadcast.emit("ON_USER_PLACE_OBJECT_UPDATE", JSON.stringify(updatedUser));
    });
};



// user rotate object event
function onRotateObject({socket, users}){
    socket.on("ON_USER_ROTATE_OBJECT", (updatedBoxObject) => {
        const user = users[socket.id];
        user.boxObject.rotation = updatedBoxObject;
        const updatedUser = {
            id: user.id,
            boxObject: updatedBoxObject
        };
        socket.broadcast.emit("ON_USER_ROTATE_OBJECT_UPDATE", JSON.stringify(updatedUser));
    });
};



// export functions
module.exports = {onChooseObject, onPlaceObject, onRotateObject};