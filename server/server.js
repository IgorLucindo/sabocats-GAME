const { SocketServer } = require("./src/SocketServer.js");
const config = require("../game/data/config.json");

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
const socketServer = new SocketServer(io, config);
socketServer.initialize();

// Start server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nAccess it at http://localhost:${PORT}`);
});
