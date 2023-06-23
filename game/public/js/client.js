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
        const updatedUser = updatedUsers[i];
        if(!users[updatedUser.id]){
            users[updatedUser.id] = updatedUser;
            // create cursor
            users[updatedUser.id].cursor = new Sprite({
                position: {x: 0, y: 0}, imageSrc: "assets/images/cursors/red/default.png"
            });
            users[updatedUser.id].cursor.gridPosition = {x: 0, y: 0};
            users[updatedUser.id].cursor.previousGridPosition = {x: 0, y: 0};
            // create online player
            if(updatedUser.onlinePlayer.loaded){
                const onlinePlayer = createOnlinePlayer({
                    id: updatedUser.onlinePlayer.id,
                    position: updatedUser.onlinePlayer.position,
                    scale: playerScale,
                    currentSprite: updatedUser.onlinePlayer.currentSprite
                });
                onlinePlayer.loaded = true;
                selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = true;
                users[updatedUser.id].onlinePlayer = onlinePlayer;
            }
        }
        else if(updatedUser.id == user.id){user.userNumber = updatedUser.userNumber;}
    };
    // sort users
    const sortedUsersArray = Object.values(users).sort((a, b) => a.userNumber - b.userNumber);
    const sortedUsers = sortedUsersArray.reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    users = sortedUsers;
});



// user's player or cursor move event
socket.on("ON_USER_UPDATE", (updatedUsers) => {
    updatedUsers = JSON.parse(updatedUsers);
    for(let i in updatedUsers){
        const updatedUser = updatedUsers[i];
        const userTemp = users[updatedUser.id];
        if(userTemp.id != user.id){
            // online player update
            gsap.to(userTemp.onlinePlayer.position, {
                x: updatedUser.onlinePlayer.position.x,
                y: updatedUser.onlinePlayer.position.y,
                duration: 0.015,
                ease: "linear"
            });
            userTemp.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
            // cursor update
            gsap.to(userTemp.cursor.position, {
                x: updatedUser.cursor.position.x,
                y: updatedUser.cursor.position.y,
                duration: 0.015,
                ease: "linear"
            });
        }
    };
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
socket.on("ON_USER_CHOOSE_MAP_UPDATE", (updatedUser) => {
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