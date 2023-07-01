// web server
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);



// directories
app.use(express.static("public", {}));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



// socket setup
const users = {};
var boxObjects = [];
io.on("connection", (socket) => {
    console.log(`[${socket.id}] LOG:USER_CONNECTED`);
    users[socket.id] = {
        id: socket.id,
        userNumber: Object.keys(users).length + 1,
        onlinePlayer: {id: undefined, position: {x: undefined, y: undefined}, loaded: false, finished: false, dead: false},
        onlineSelectablePlayer: {id: undefined},
        chooseMap: {current: undefined, previous: undefined},
        boxObject: {position: {x: 0, y: 0}, boxNumber: undefined, chose: false, placed: false, rotation: 0},
        points: {victories: 0},
        cursor: {position: {x: 0, y: 0}, gridPosition: {x: 0, y: 0}, previousGridPosition: {x: 0, y: 0}}
    };
    io.emit("ON_USER_CONNECT", JSON.stringify(users));

    // user disconnect event
    socket.on("disconnect", () => {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        const user = users[socket.id];
        // update other users numbers
        for(let i in users){
            if(users[i].userNumber > user.userNumber){users[i].userNumber -= 1;}
        };
        // delete user
        io.emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify(user));
        delete users[socket.id];
        
    });

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

    // user choose player event
    socket.on("ON_USER_CHOOSE_PLAYER", (updatedUser) => {
        const user = users[socket.id];
        user.onlinePlayer.id = updatedUser.onlinePlayer.id;
        user.onlinePlayer.loaded = true;
        user.onlineSelectablePlayer.id = updatedUser.onlineSelectablePlayer.id;
        socket.broadcast.emit("ON_USER_CHOOSE_PLAYER_UPDATE", JSON.stringify(user));
    });

    // user player unloaded event
    socket.on("ON_USER_PLAYER_UNLOAD", () => {
        const user = users[socket.id];
        user.onlinePlayer.loaded = false;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    });

    // user player finished event
    socket.on("ON_USER_PLAYER_FINISH", (playerDead) => {
        const user = users[socket.id];
        user.onlinePlayer.loaded = false;
        user.onlinePlayer.finished = true;
        user.onlinePlayer.dead = playerDead;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    });

    

    // user choose map event
    socket.on("ON_USER_CHOOSE_MAP", (updatedChooseMap) => {
        socket.broadcast.emit("ON_USER_CHOOSE_MAP_UPDATE", JSON.stringify(updatedChooseMap));
    });

    // objects created in box of player 1 event
    socket.on("ON_OBJECTS_IN_BOX_CREATED", (updatedBoxObjects) => {
        boxObjects = updatedBoxObjects;
        socket.broadcast.emit("ON_OBJECTS_IN_BOX_CREATED_UPDATE", JSON.stringify(boxObjects));
    });

    // user choose object event
    socket.on("ON_USER_CHOOSE_OBJECT", (updatedBoxObject) => {
        const user = users[socket.id];
        user.boxObject = updatedBoxObject;
        boxObjects[updatedBoxObject.boxNumber].chose = true;
        const updatedUser = {id: user.id, boxObject: updatedBoxObject};
        const updatedUserAndBoxObjects = [updatedUser, boxObjects];

        socket.broadcast.emit("ON_USER_CHOOSE_OBJECT_UPDATE", JSON.stringify(updatedUserAndBoxObjects));
    });

    // user place object event
    socket.on("ON_USER_PLACE_OBJECT", (updatedBoxObject) => {
        const user = users[socket.id];
        user.boxObject = updatedBoxObject;
        const updatedUser = {id: user.id, boxObject: updatedBoxObject};

        socket.broadcast.emit("ON_USER_PLACE_OBJECT_UPDATE", JSON.stringify(updatedUser));
    });

    // user rotate object event
    socket.on("ON_USER_ROTATE_OBJECT", (updatedBoxObject) => {
        const user = users[socket.id];
        user.boxObject.rotation = updatedBoxObject;
        const updatedUser = {
            id: user.id,
            boxObject: updatedBoxObject
        };
        socket.broadcast.emit("ON_USER_ROTATE_OBJECT_UPDATE", JSON.stringify(updatedUser));
    });
});



// start server
http.listen(3000, () => {
    console.log('listening on *:3000');
});