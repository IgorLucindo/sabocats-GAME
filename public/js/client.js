const socket = io();
// connect to socket event
socket.on("connect", () => {
    user.id = socket.id;
    users[socket.id] = user;
    sessionStorage.setItem("userId", user.id);
});



// user connect event
socket.on("ON_USER_CONNECT", (updatedUsers) => {
    updatedUsers = JSON.parse(updatedUsers);
    for(let i in updatedUsers){
        if(!users[updatedUsers[i].id]){
            users[updatedUsers[i].id] = updatedUsers[i];

            if(updatedUsers[i].onlinePlayer.loaded){
                const onlinePlayer = createOnlinePlayer({
                    id: updatedUsers[i].onlinePlayer.id,
                    position: updatedUsers[i].onlinePlayer.position,
                    scale: playerScale,
                    currentSprite: updatedUsers[i].onlinePlayer.currentSprite
                });
                onlinePlayer.loaded = true;
                selectablePlayers[updatedUsers[i].onlineSelectablePlayer.id-1].selected = true;
                users[updatedUsers[i].id].onlinePlayer = onlinePlayer;
            }
        }
    };
});



// online player move event
socket.on("ON_USER_PLAYER_MOVE_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].onlinePlayer.position.x = updatedUser.onlinePlayer.position.x;
    users[updatedUser.id].onlinePlayer.position.y = updatedUser.onlinePlayer.position.y;
    users[updatedUser.id].onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
});



// user select player event
socket.on("ON_USER_SELECT_PLAYER_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    const onlinePlayer = createOnlinePlayer({
        id: updatedUser.onlinePlayer.id,
        scale: playerScale
    });
    onlinePlayer.loaded = true;
    selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = true;
    users[updatedUser.id].onlinePlayer = onlinePlayer;
});



// user event
socket.on("ON_USER_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].chooseMap = updatedUser.chooseMap;
});



// user player event
socket.on("ON_USER_PLAYER_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
    selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = false;
});



// user disconnect event
socket.on("ON_USER_DISCONNECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    delete users[updatedUser.id];
});