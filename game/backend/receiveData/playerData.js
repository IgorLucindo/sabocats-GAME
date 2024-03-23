// general user update event
function onUserUpdate({socket, io, users}){
    socket.on("ON_USER", (updatedUser) => {
        const user = users[socket.id];
        // online player update
        user.onlinePlayer.position.x = updatedUser.onlinePlayer.position.x;
        user.onlinePlayer.position.y = updatedUser.onlinePlayer.position.y;
        user.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
        // cursor update
        user.cursor.position.x = updatedUser.cursor.position.x;
        user.cursor.position.y = updatedUser.cursor.position.y;
    });
    setInterval(() => {io.emit("ON_USER_UPDATE", JSON.stringify(users));}, 15);
};



// user choose player event
function onChoosePlayer({socket, users}){
    socket.on("ON_USER_CHOOSE_PLAYER", (updatedUser) => {
        const user = users[socket.id];
        user.onlinePlayer.id = updatedUser.onlinePlayer.id;
        user.onlinePlayer.loaded = true;
        user.onlineSelectablePlayer.id = updatedUser.onlineSelectablePlayer.id;
        socket.broadcast.emit("ON_USER_CHOOSE_PLAYER_UPDATE", JSON.stringify(user));
    });
};



// user player unload event
function onUnloadPlayer({socket, users}){
    socket.on("ON_USER_PLAYER_UNLOAD", () => {
        const user = users[socket.id];
        user.onlinePlayer.loaded = false;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    });
};



// user player finish event
function onFinishPlayer({socket, users}){
    socket.on("ON_USER_PLAYER_FINISH", (playerDead) => {
        const user = users[socket.id];
        user.onlinePlayer.loaded = false;
        user.onlinePlayer.finished = true;
        user.onlinePlayer.dead = playerDead;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    });
};



// export functions
module.exports = {onUserUpdate, onChoosePlayer, onUnloadPlayer, onFinishPlayer};