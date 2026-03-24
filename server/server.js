const { MatchServer } = require("./src/classes/MatchServer.js");
const { onConnection, onDisconnection } = require("./src/utils/receiveData/connectionData.js");
const { onUserUpdate, onChoosePlayer, onUnloadPlayer, onFinishPlayer } = require("./src/utils/receiveData/playerData.js");
const { onChooseObject, onPlaceObject, onRotateObject } = require("./src/utils/receiveData/objectData.js");
const { onChooseMap } = require("./src/utils/receiveData/mapData.js");
const { onJoinMatch, onChangeMatch } = require("./src/utils/receiveData/matchData.js");

// Port
const PORT = process.env.PORT || 3000;

// Web server
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);


// Directories
app.use(express.static("game", {}));


// Socket setup
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


// Start server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
