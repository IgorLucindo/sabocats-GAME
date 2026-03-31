// SocketServer - Centralized socket event handling (mirrors client SocketHandler)

const { MatchServer } = require("./MatchServer.js");

class SocketServer {
    constructor(io, config) {
        this.io = io;
        this.config = config;
        this.rooms = {};
    }

    initialize() {
        this.io.on('connection', (socket) => {
            this.onConnection(socket);
            this.setupConnectionHandlers(socket);
            this.setupRoomHandlers(socket);
            this.setupUserHandlers(socket);
            this.setupObjectHandlers(socket);
            this.setupMapHandlers(socket);
            this.setupMatchHandlers(socket);
        });

        // Tick broadcast — per-room, created once
        setInterval(() => {
            for (const roomId in this.rooms) {
                const room = this.rooms[roomId];
                this.io.to(roomId).emit("ON_TICK", JSON.stringify(room.users));
            }
        }, 15);
    }

    // ===== Connection =====

    onConnection(socket) {
        console.log(`[${socket.id}] LOG:USER_CONNECTED`);
        socket.roomId = null;
    }

    setupConnectionHandlers(socket) {
        socket.on('disconnect', () => this.onDisconnect(socket));
        socket.on('ON_PING', (timestamp) => socket.emit('ON_PONG', timestamp));
    }

    onDisconnect(socket) {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        if (socket.roomId) { this._leaveRoom(socket); }
    }

    // ===== Rooms =====

    setupRoomHandlers(socket) {
        socket.on('CREATE_ROOM', (code) => this.onCreate(socket, code));
        socket.on('JOIN_ROOM',   (code) => this.onJoin(socket, code));
        socket.on('KICK_PLAYER', (targetId) => this.onKick(socket, targetId));
        socket.on('GET_ROOMS',   () => this.onGetRooms(socket));
    }

    onGetRooms(socket) {
        const list = Object.values(this.rooms).map(room => ({
            id:          room.id,
            playerCount: Object.keys(room.users).length,
            maxPlayers:  this.config.room.maxPlayers
        }));
        socket.emit('ROOMS_LIST', JSON.stringify(list));
    }

    onCreate(socket, code) {
        const roomId = code || this._generateRoomCode();
        const room = {
            id: roomId,
            hostId: socket.id,
            users: {},
            match: new MatchServer({ maxPlayers: this.config.room.maxPlayers })
        };
        this.rooms[roomId] = room;
        socket.roomId = roomId;
        socket.join(roomId);

        const user = this._createUserEntry(socket.id, 1);
        room.users[socket.id] = user;
        room.match.numberOfUsers = 1;

        // Send user entry first so client has it before showing the panel
        socket.emit("ON_USER_CONNECT", JSON.stringify({ [socket.id]: user }));
        socket.emit("ROOM_CREATED", JSON.stringify({ roomId, hostId: socket.id }));

        console.log(`[${socket.id}] Created room ${roomId}`);
    }

    onJoin(socket, code) {
        const room = this.rooms[code.toUpperCase()];
        if (!room) { socket.emit("ROOM_NOT_FOUND"); return; }
        if (Object.keys(room.users).length >= this.config.room.maxPlayers) { socket.emit("ROOM_FULL"); return; }

        if (socket.roomId) { this._leaveRoom(socket); }

        socket.roomId = room.id;
        socket.join(room.id);

        const loginOrder = Object.keys(room.users).length + 1;
        const user = this._createUserEntry(socket.id, loginOrder);
        room.users[socket.id] = user;
        room.match.numberOfUsers++;

        // Send ROOM_JOINED first so client can reset state before receiving users
        socket.emit("ROOM_JOINED", JSON.stringify({ roomId: room.id, hostId: room.hostId }));
        socket.emit("ON_USER_CONNECT", JSON.stringify(room.users));
        socket.to(room.id).emit("ON_USER_CONNECT", JSON.stringify({ [socket.id]: user }));

        console.log(`[${socket.id}] Joined room ${room.id}`);
    }

    onKick(socket, targetId) {
        const room = this._getRoom(socket);
        if (!room || room.hostId !== socket.id) return;

        const targetSocket = this.io.sockets.sockets.get(targetId);
        if (!targetSocket || !room.users[targetId]) return;

        targetSocket.emit("ON_KICKED");
        this._leaveRoom(targetSocket);
    }

    // ===== Users =====

    setupUserHandlers(socket) {
        socket.on("ON_TICK",               (data) => this.onTick(socket, data));
        socket.on("ON_USER_UPDATE_PLAYER", (data) => this.onUpdatePlayer(socket, data));
    }

    onTick(socket, updatedUser) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        user.localPlayer.position.x    = updatedUser.localPlayer.position.x;
        user.localPlayer.position.y    = updatedUser.localPlayer.position.y;
        user.localPlayer.currentSprite = updatedUser.localPlayer.currentSprite;
        user.cursor.position.x          = updatedUser.cursor.position.x;
        user.cursor.position.y          = updatedUser.cursor.position.y;
    }

    onUpdatePlayer(socket, updatedPlayerData) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        const { localPlayer, characterOption } = updatedPlayerData;
        user.localPlayer.id = localPlayer.id;
        user.localPlayer.loaded = localPlayer.loaded;
        user.localPlayer.finished = localPlayer.finished;
        user.localPlayer.dead = localPlayer.dead;
        user.characterOption.id = characterOption.id;

        socket.to(room.id).emit("ON_USER_UPDATE_PLAYER", JSON.stringify({
            id: user.id,
            localPlayer: user.localPlayer,
            characterOption: user.characterOption
        }));

        if (localPlayer.finished) {
            const allDone = Object.values(room.users).every(u => u.localPlayer.finished);
            if (allDone) {
                this._calculatePoints(room);
                const updatedState = "scoreboard";
                this.io.to(room.id).emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
                room.match.update({ io: this.io.to(room.id) }, updatedState);
            }
        }
    }

    // ===== Objects =====

    setupObjectHandlers(socket) {
        socket.on("ON_USER_UPDATE_PLACEABLEOBJECT", (data) => this.onUpdatePlaceableObject(socket, data));
    }

    onUpdatePlaceableObject(socket, updatedPlaceableObject) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        // Reject duplicate crateIndex: if another user already claimed this index, send conflict back
        if (updatedPlaceableObject.chose && updatedPlaceableObject.crateIndex !== undefined) {
            const takenByOther = Object.values(room.users).some(
                u => u.id !== socket.id &&
                     u.placeableObject.chose &&
                     u.placeableObject.crateIndex === updatedPlaceableObject.crateIndex
            );
            if (takenByOther) {
                socket.emit("ON_CRATE_INDEX_CONFLICT", JSON.stringify({ crateIndex: updatedPlaceableObject.crateIndex }));
                return;
            }
        }

        user.placeableObject.crateIndex = updatedPlaceableObject.crateIndex;
        user.placeableObject.chose      = updatedPlaceableObject.chose;
        user.placeableObject.placed     = updatedPlaceableObject.placed;
        user.placeableObject.position   = updatedPlaceableObject.position;
        user.placeableObject.rotation   = updatedPlaceableObject.rotation;

        socket.to(room.id).emit("ON_USER_UPDATE_PLACEABLEOBJECT", JSON.stringify({ id: user.id, placeableObject: updatedPlaceableObject }));

        if (updatedPlaceableObject.chose && !updatedPlaceableObject.placed) {
            const allChose = Object.values(room.users).every(u => u.placeableObject.chose);
            if (allChose) {
                const updatedState = "placing";
                room.match.update({ io: this.io.to(room.id) }, updatedState);
                this.io.to(room.id).emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            }
        }

        if (updatedPlaceableObject.placed) {
            const allPlaced = Object.values(room.users).every(u => u.placeableObject.placed);
            if (allPlaced) {
                const updatedState = "playing";
                room.match.update({ io: this.io.to(room.id) }, updatedState);
                this.io.to(room.id).emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            }
        }
    }

    // ===== Map =====

    setupMapHandlers(socket) {
        socket.on("ON_USER_CHOOSE_MAP", (data) => this.onChooseMap(socket, data));
    }

    onChooseMap(socket, updatedChooseMap) {
        const room = this._getRoom(socket);
        if (!room) return;
        socket.to(room.id).emit("ON_USER_CHOOSE_MAP_UPDATE", JSON.stringify(updatedChooseMap));
    }

    // ===== Match =====

    setupMatchHandlers(socket) {
        socket.on("ON_USER_JOIN_MATCH",         () =>     this.onJoinMatch(socket));
        socket.on("ON_USER_CHANGE_MATCH_STATE", (data) => this.onChangeMatch(socket, data));
    }

    onJoinMatch(socket) {
        const room = this._getRoom(socket);
        if (!room) return;
        room.match.whenSyncedUsers(() => {
            room.match.update({ io: this.io.to(room.id) }, "choosing");
            this.io.to(room.id).emit("ON_START_MATCH");
            this._resetPlaceableObjects(room);
        });
    }

    onChangeMatch(socket, updatedState) {
        const room = this._getRoom(socket);
        if (!room) return;
        room.match.whenSyncedUsers(() => {
            room.match.update({ io: this.io.to(room.id) }, updatedState);
            this.io.to(room.id).emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            if (updatedState === "choosing") { this._resetPlaceableObjects(room); }
        });
    }

    // ===== Helpers =====

    _calculatePoints(room) {
        const userList = Object.values(room.users);
        const anyDied = userList.some(u => u.localPlayer.dead);
        if (!anyDied) return;
        for (const user of userList) {
            if (!user.localPlayer.dead) { user.points.victories++; }
        }
    }

    _resetPlaceableObjects(room) {
        for (let id in room.users) {
            room.users[id].placeableObject.chose      = false;
            room.users[id].placeableObject.placed     = false;
            room.users[id].placeableObject.crateIndex = undefined;
            room.users[id].placeableObject.rotation   = 0;
        }
    }

    _leaveRoom(socket) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        for (let i in room.users) {
            if (room.users[i].loginOrder > user.loginOrder) { room.users[i].loginOrder -= 1; }
        }
        delete room.users[socket.id];
        room.match.numberOfUsers--;

        this.io.to(room.id).emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify({
            disconnectedUser: user,
            updatedLoginOrders: Object.fromEntries(Object.entries(room.users).map(([id, u]) => [id, u.loginOrder]))
        }));

        if (room.hostId === socket.id) {
            const remaining = Object.keys(room.users);
            if (remaining.length > 0) {
                room.hostId = remaining[0];
                this.io.to(room.id).emit("ON_HOST_CHANGED", JSON.stringify({ hostId: room.hostId }));
            } else {
                delete this.rooms[room.id];
            }
        }

        socket.leave(room.id);
        socket.roomId = null;
    }

    _getRoom(socket) {
        return socket.roomId ? this.rooms[socket.roomId] : null;
    }

    _generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const len = this.config.room.codeLength;
        let code;
        do {
            code = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        } while (this.rooms[code]);
        return code;
    }

    _createUserEntry(socketId, loginOrder) {
        return {
            id: socketId,
            loginOrder,
            localPlayer:     { id: undefined, position: { x: undefined, y: undefined }, loaded: false, finished: false, dead: false },
            characterOption: { id: undefined },
            chooseMap:       { current: undefined, previous: undefined },
            placeableObject: { position: { x: 0, y: 0 }, crateIndex: undefined, chose: false, placed: false, rotation: 0 },
            points:          { victories: 0 },
            cursor:          { position: { x: 0, y: 0 }, gridPosition: { x: 0, y: 0 }, previousGridPosition: { x: 0, y: 0 } }
        };
    }
}

module.exports = { SocketServer };
