// user join match
function onJoinMatch({socket, io, users, match}){
    socket.on("ON_USER_JOIN_MATCH", () => {
        match.totalJoinedPlayers++;
        const numberOfPlayers = Object.keys(users).length;
        if(match.totalJoinedPlayers === numberOfPlayers){
            match.totalJoinedPlayers = 0;
            io.emit("ON_START_MATCH");
        }
    });
};

// user change match state event
function onChangeMatch({socket, io, match}){
    socket.on("ON_CHANGE_MATCH_STATE", (updatedMacthState) => {
        match.state = updatedMacthState;
        match.processState({io});
    });
};



// export functions
module.exports = {onJoinMatch, onChangeMatch};