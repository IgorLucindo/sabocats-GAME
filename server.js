// web server
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);



// directories
app.use("/public", express.static("public", {}));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



// socket setup
const users = {};
io.on("connection", (socket) => {
    console.log(`[${socket.id}] LOG:USER_CONNECTED`);
    users[socket.id] = {
        id: socket.id,
        onlinePlayer: {id: undefined, position: {x: undefined, y: undefined}},
        onlineSelectablePlayer: {id: undefined},
        chooseMap: {chose: false, map: undefined}
    };
    io.emit("ON_USER_CONNECT", JSON.stringify(users));

    // user disconnect event
    socket.on("disconnect", () => {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        const user = users[socket.id];
        io.emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify(user));
        delete users[socket.id];
    });

    // user's player move event
    socket.on("ON_USER_MOVE", (updatedUser) => {
        const user = users[socket.id];
        user.onlinePlayer.position.x = updatedUser.onlinePlayer.position.x;
        user.onlinePlayer.position.y = updatedUser.onlinePlayer.position.y;
        user.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
        socket.broadcast.emit("ON_USER_PLAYER_MOVE_UPDATE", JSON.stringify(user));
    });

    // user select player event
    socket.on("ON_USER_SELECT_PLAYER", (updatedUser) => {
        const user = users[socket.id];
        user.onlinePlayer.id = updatedUser.onlinePlayer.id;
        user.onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
        user.onlineSelectablePlayer.id = updatedUser.onlineSelectablePlayer.id;
        socket.broadcast.emit("ON_USER_SELECT_PLAYER_UPDATE", JSON.stringify(user));
    });

    // user player loaded state event
    socket.on("ON_USER_PLAYER_LOADED", (updatedUser) => {
        const user = users[socket.id];
        user.onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    });

    // user choose map event
    socket.on("ON_USER_CHOOSE_MAP", (updatedUser) => {
        const user = users[socket.id];
        user.chooseMap = updatedUser.chooseMap;
        socket.broadcast.emit("ON_USER_UPDATE", JSON.stringify(user));
    });
});



// start server
http.listen(3000, () => {
    console.log('listening on *:3000');
});