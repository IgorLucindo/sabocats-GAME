const socket = io();
// connect to socket event
socket.on("connect", () => {
    user.id = socket.id;
    users[socket.id] = user;
    socketConnected = true;
});



// user connect event
socket.on("ON_USER_CONNECT", (updatedUsers) => {
    updatedUsers = JSON.parse(updatedUsers);
    for(let i in updatedUsers){
        if(!users[updatedUsers[i].id]){
            users[updatedUsers[i].id] = updatedUsers[i];
            // create cursor
            users[updatedUsers[i].id].cursor = new Sprite({
                position: {x: 0, y: 0}, imageSrc: "../assets/images/cursors/red/default.png"
            });
            // create online player
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
        else if(updatedUsers[i].id == user.id){user.userNumber = updatedUsers[i].userNumber;}
    };
    // sort users
    const sortedUsersArray = Object.values(users).sort((a, b) => a.userNumber - b.userNumber);
    const sortedUsers = sortedUsersArray.reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    users = sortedUsers;
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
    const onlinePlayer = users[updatedUser.id].onlinePlayer;
    onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
    if(updatedUser.onlinePlayer.finished){
        onlinePlayer.finished = true;
        onlinePlayer.dead = updatedUser.onlinePlayer.dead;
        playersFinished++;
    }
    else{selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = false;};
});



// user move mouse event
socket.on("ON_USER_MOVE_MOUSE_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].cursor.position = updatedUser.cursor.position;
    users[updatedUser.id].cursor.gridPosition = updatedUser.cursor.gridPosition;
    users[updatedUser.id].cursor.previousGridPosition = updatedUser.cursor.previousGridPosition;
});



// user disconnect event
socket.on("ON_USER_DISCONNECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    delete users[updatedUser.id];
});



// objects created in box of player 1 event
socket.on("ON_OBJECTS_IN_BOX_CREATED_UPDATE", (updatedBoxObjects) => {
    updatedBoxObjects = JSON.parse(updatedBoxObjects);
    boxObjects = updatedBoxObjects;
});



// user choose object event
socket.on("ON_USER_CHOOSE_OBJECT_UPDATE", (updatedUserAndBoxObjects) => {
    const [updatedUser, updatedBoxObjects] = JSON.parse(updatedUserAndBoxObjects);
    users[updatedUser.id].boxObject = updatedUser.boxObject;
    if(box.objects && box.objects.length != 0){
        const object = box.objects[updatedUser.boxObject.boxNumber];
        object.selected = true;
        box.objectsChosed++;
    }
    else{boxObjects = updatedBoxObjects;};
});

// user place object event
socket.on("ON_USER_PLACE_OBJECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].boxObject = updatedUser.boxObject;
    const object = box.objects[updatedUser.boxObject.boxNumber];
    object.position = updatedUser.boxObject.position;
    object.placed = true;
    object.previousPlaced = false;
});

// user rotate object event
socket.on("ON_USER_ROTATE_OBJECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].boxObject.rotation = updatedUser.boxObject.rotation;
    const object = box.objects[updatedUser.boxObject.boxNumber];
    object.rotation = updatedUser.boxObject.rotation;
});