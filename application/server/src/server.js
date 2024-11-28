// web server
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// import backend functions
const {onConnection, onDisconnection} = require("./receiveData/connectionData.js");
const {onUserUpdate, onChoosePlayer, onUnloadPlayer, onFinishPlayer} = require("./receiveData/playerData.js");
const {onChooseObject, onPlaceObject, onRotateObject} = require("./receiveData/objectData.js");
const {onChooseMap} = require("./receiveData/mapData.js");
const {onJoinMatch, onChangeMatch} = require("./receiveData/matchData.js");

// import backend classes
const {MatchServer} = require("./classes/matchServer.js");



// directories
app.use(express.static("../../game", {}));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '../index.html');
});



// socket setup
var users = {};

const match = new MatchServer();

io.on("connection", (socket) => {
    onConnection({socket, io, users, match});
    onDisconnection({socket, io, users, match});

    onUserUpdate({socket, io, users});
    onChoosePlayer({socket, users});
    onUnloadPlayer({socket, users});
    onFinishPlayer({socket, io, users, match});

    onChooseObject({socket, io, users, match});
    onPlaceObject({socket, io, users, match});
    onRotateObject({socket, users});

    onChooseMap({socket});

    onJoinMatch({socket, io, match});
    onChangeMatch({socket, io, match});
});



// start server
http.listen(3000, () => {
    console.log('listening on *:3000');
});