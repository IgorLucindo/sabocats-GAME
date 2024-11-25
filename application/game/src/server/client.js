const socket = io();
// connect to socket event
socket.on("connect", () => {
    user.id = socket.id;
    users[socket.id] = user;
    user.connected = true;
});



// user connect event
socket.on("ON_USER_CONNECT", (updatedUsers) => {
    updatedUsers = JSON.parse(updatedUsers);

    for(let i in updatedUsers){
        const updatedUser = updatedUsers[i];
        
        // add new users
        if(!users[updatedUser.id]){
            const newUser = updatedUser;
            
            // create cursor
            newUser.cursor = new Sprite({
                position: {x: 0, y: 0}, imageSrc: "assets/images/cursors/red/default.png"
            });
            newUser.cursor.gridPosition = {x: 0, y: 0};
            newUser.cursor.previousGridPosition = {x: 0, y: 0};

            // create online player
            if(updatedUser.onlinePlayer.loaded){
                const onlinePlayer = createOnlinePlayer({
                    id: updatedUser.onlinePlayer.id,
                    position: updatedUser.onlinePlayer.position,
                    currentSprite: updatedUser.onlinePlayer.currentSprite
                });
                selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = true;
                newUser.onlinePlayer = onlinePlayer;
            }
            users[updatedUser.id] = newUser;
        }
        // add current user
        else if(users[updatedUser.id].id === user.id){
            users[updatedUser.id] = updatedUser;
        }
    };
});



// user disconnect event
socket.on("ON_USER_DISCONNECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    delete users[updatedUser.id];
});



// user's player or cursor move event
socket.on("ON_USER_UPDATE", (updatedUsers) => {
    updatedUsers = JSON.parse(updatedUsers);
    for(let i in updatedUsers){
        const updatedUser = updatedUsers[i];
        const userTemp = users[updatedUser.id];

        // skip if player doesn't exist or current player
        if(!userTemp || userTemp.id === user.id){continue;}

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
    };
});



// user choose player event
socket.on("ON_USER_CHOOSE_PLAYER_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    const onlinePlayer = createOnlinePlayer({
        id: updatedUser.onlinePlayer.id,
    });
    selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = true;
    users[updatedUser.id].onlinePlayer = onlinePlayer;
});



// user event
socket.on("ON_USER_CHOOSE_MAP_UPDATE", (updatedChooseMap) => {
    updatedChooseMap = JSON.parse(updatedChooseMap);
    voteMap(updatedChooseMap);
});



// user player event
socket.on("ON_USER_PLAYER_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    const onlinePlayer = users[updatedUser.id].onlinePlayer;
    onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
    if(updatedUser.onlinePlayer.finished){
        onlinePlayer.finished = true;
        onlinePlayer.dead = updatedUser.onlinePlayer.dead;
    }
    else{selectablePlayers[updatedUser.onlineSelectablePlayer.id-1].selected = false;};
});



// start match event
socket.on("ON_START_MATCH", () => {
    match.start();
});



// change match state event
socket.on("ON_CHANGE_MATCH_STATE", (updatedState) => {
    updatedState = JSON.parse(updatedState);
    match.setState(updatedState);
});



// receive generated box objects
socket.on("ON_GENERATE_BOX_OBJECTS", (updatedSeed) => {
    updatedSeed = JSON.parse(updatedSeed);
    box.seed = updatedSeed;
    box.canOpen = true;
});



// user choose object event
socket.on("ON_USER_CHOOSE_OBJECT_UPDATE", (updatedUserIDAndBoxObjectId) => {
    const [updatedUserId, updatedBoxObjectId] = JSON.parse(updatedUserIDAndBoxObjectId);
    
    // update box if not updated yet
    box.update();

    // choose object
    const object = box.objects[updatedBoxObjectId];
    object.chose = true;

    // link user to chose object
    const boxObject = users[updatedUserId].boxObject;
    boxObject.boxId = updatedBoxObjectId;
    boxObject.chose = true;
});



// user place object event
socket.on("ON_USER_PLACE_OBJECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    users[updatedUser.id].boxObject = updatedUser.boxObject;
    const object = box.objects[updatedUser.boxObject.boxId];
    object.position = updatedUser.boxObject.position;
    object.placed = true;
    object.previousPlaced = false;
});



// user rotate object event
socket.on("ON_USER_ROTATE_OBJECT_UPDATE", (updatedUser) => {
    updatedUser = JSON.parse(updatedUser);
    const updatedRotation = updatedUser.boxObject.rotation;
    users[updatedUser.id].boxObject.rotation = updatedRotation;
    const object = box.objects[updatedUser.boxObject.boxId];
    object.rotation = updatedRotation;
    if(object.auxObject){object.auxObject.rotation = updatedRotation;}
});