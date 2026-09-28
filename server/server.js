const { SocketServer } = require("./src/SocketServer.js");
const { setupDevWatcher } = require("./src/utils.js");
const config = require("../game/data/config.json");
const manifest = require("../game/data/manifest.json");
const path = require("path");

// Port
const PORT = process.env.PORT || 3000;

// Web server
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Directories
app.use(express.static(path.join(__dirname, "../game")));

// Socket setup
const socketServer = new SocketServer(io, config, manifest);
socketServer.initialize();

// Start server
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nAccess it at http://localhost:${PORT}`);
    
    // Start watching the frontend folder for changes
    setupDevWatcher(io, path.join(__dirname, '../game'));
});