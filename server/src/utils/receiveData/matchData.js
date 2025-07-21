// user join match
function onJoinMatch({socket, io, match}){
    socket.on("ON_USER_JOIN_MATCH", () => {
        // sync users and change to choosing match state
        match.whenSyncedUsers( () => {
            // send message to start match to client
            io.emit("ON_START_MATCH");

            // update match in server
            const updatedState = "choosing";
            match.update({io}, updatedState);
        });
    });
};



// user change match state
function onChangeMatch({socket, io, match}){
    socket.on("ON_USER_CHANGE_MATCH_STATE", (updatedState) => {
        // sync users and change match state
        match.whenSyncedUsers( () => {
            // send state to client
            io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));

            // update match in server
            match.update({io}, updatedState);
        });
    });
};



// export functions
module.exports = {onJoinMatch, onChangeMatch};