const { MatchServer } = require("./src/classes/MatchServer.js");
const { SocketServer } = require("./src/SocketServer.js");

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
const users = {};
const match = new MatchServer();
const socketServer = new SocketServer(io, users, match);
socketServer.initialize();

// Start server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nAccess it at http://localhost:${PORT}`);
});
