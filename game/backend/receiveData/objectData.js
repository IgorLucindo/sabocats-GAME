// user choose object event
function onChooseObject({socket, io, users, match}){
    socket.on("ON_USER_CHOOSE_OBJECT", (updatedBoxObjectId) => {
        // update chosen object in users
        const user = users[socket.id];
        user.boxObject.chose = true;

        // send updated object and respective user to client
        const updatedUserIDAndBoxObjectId = [user.id, updatedBoxObjectId];
        socket.broadcast.emit("ON_USER_CHOOSE_OBJECT_UPDATE", JSON.stringify(updatedUserIDAndBoxObjectId));

        // sync users and change to placing match state
        match.whenSyncedUsers( () => {
            // send state to client
            const updatedState = "placing";
            io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));

            // update match in server
            match.update({io}, updatedState);
        });
    });
};



// user place object event
function onPlaceObject({socket, io, users, match}){
    socket.on("ON_USER_PLACE_OBJECT", (updatedBoxObject) => {
        // update placed object in users
        const user = users[socket.id];
        user.boxObject = updatedBoxObject;

        // send updated object and respective user to client
        const updatedUser = {id: user.id, boxObject: updatedBoxObject};
        socket.broadcast.emit("ON_USER_PLACE_OBJECT_UPDATE", JSON.stringify(updatedUser));

        // sync users and change to playing match state
        match.whenSyncedUsers( () => {
            // send state to client
            const updatedState = "playing";
            io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            
            // update match in server
            match.update({io}, updatedState);
        });
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