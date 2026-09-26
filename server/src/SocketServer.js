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
            this.setupChatHandlers(socket);
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
        socket.sessionId = socket.handshake?.auth?.sessionId;

        const resumed = this._resumeSession(socket);
        if (resumed) {
            socket.emit("ON_RECONNECT_HYDRATE", JSON.stringify(this._createHydrationPayload(resumed.room, socket.id)));
        }
    }

    setupConnectionHandlers(socket) {
        socket.on('disconnect', () => this.onDisconnect(socket));
        socket.on('ON_PING', (timestamp) => socket.emit('ON_PONG', timestamp));
    }

    onDisconnect(socket) {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        const room = this._getRoom(socket);
        if (!room) return;

        const user = room.users[socket.id];
        const sessionId = user?.sessionId || socket.sessionId;
        if (!user || !sessionId) {
            this._leaveRoom(socket);
            return;
        }

        room.disconnectedSessions ||= {};
        const existing = room.disconnectedSessions[sessionId];
        if (existing) clearTimeout(existing.timeout);
        const timeout = setTimeout(() => {
            const pending = room.disconnectedSessions?.[sessionId];
            if (!pending || pending.socketId !== socket.id) return;
            delete room.disconnectedSessions[sessionId];
            this._leaveRoom(socket);
        }, this.config.network.reconnectGracePeriod);

        room.disconnectedSessions[sessionId] = { socketId: socket.id, timeout };
    }

    _resumeSession(socket) {
        const sessionId = socket.sessionId;
        if (typeof sessionId !== 'string' || !/^[A-Za-z0-9]{16}$/.test(sessionId)) return null;

        for (const room of Object.values(this.rooms)) {
            const pending = room.disconnectedSessions?.[sessionId];
            if (!pending) continue;

            clearTimeout(pending.timeout);
            delete room.disconnectedSessions[sessionId];
            const oldId = pending.socketId;
            const user = room.users[oldId];
            if (!user) return null;

            const wasHost = room.hostId === oldId;
            delete room.users[oldId];
            user.id = socket.id;
            user.sessionId = sessionId;
            room.users[socket.id] = user;
            if (wasHost) room.hostId = socket.id;

            socket.roomId = room.id;
            socket.sessionResumed = true;
            socket.join(room.id);

            const reconnectEvent = {
                oldId,
                newId: socket.id,
                user,
                hostId: room.hostId
            };
            socket.to(room.id).emit('ON_USER_RECONNECTED', JSON.stringify(reconnectEvent));
            if (wasHost) {
                this.io.to(room.id).emit('ON_HOST_CHANGED', JSON.stringify({ hostId: room.hostId }));
            }
            return { room, user };
        }
        return null;
    }

    _createHydrationPayload(room, socketId) {
        return {
            roomId: room.id,
            hostId: room.hostId,
            matchSettings: room.matchSettings,
            matchState: room.match.currentState || 'lobby',
            mapName: room.activeMapName || null,
            matchSeed: room.match.seed,
            users: room.users,
            placedObjectsHistory: room.match.placedObjectsHistory,
            localUserId: socketId
        };
    }

    // ===== Rooms =====

    setupRoomHandlers(socket) {
        socket.on('CREATE_ROOM', (code) => this.onCreate(socket, code));
        socket.on('JOIN_ROOM',   (code) => this.onJoin(socket, code));
        socket.on('KICK_PLAYER', (targetId) => this.onKick(socket, targetId));
        socket.on('LEAVE_ROOM',  (ack) => {
            this._leaveRoom(socket);
            if (typeof ack === 'function') ack();
        });
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
        if (socket.sessionResumed) {
            socket.sessionResumed = false;
            return;
        }
        if (socket.roomId) this._leaveRoom(socket);
        const roomId = code || this._generateRoomCode();
        const room = {
            id: roomId,
            hostId: socket.id,
            users: {},
            disconnectedSessions: {},
            activeMapName: 'lobby',
            match: new MatchServer({ maxPlayers: this.config.room.maxPlayers }),
            matchSettings: {
                pointsToWin: this.config.matchSettings.pointsToWin,
                lives: this.config.matchSettings.lives,
                enabledObjects: {}
            }
        };
        this.rooms[roomId] = room;
        socket.roomId = roomId;
        socket.join(roomId);

        const user = this._createUserEntry(socket.id, 1, socket.sessionId);
        room.users[socket.id] = user;
        room.match.numberOfUsers = 1;

        // Send user entry first so client has it before showing the panel
        socket.emit("ON_USER_CONNECT", JSON.stringify({ [socket.id]: user }));
        socket.emit("ROOM_CREATED", JSON.stringify({ roomId, hostId: socket.id, matchSettings: room.matchSettings }));

        console.log(`[${socket.id}] Created room ${roomId}`);
    }

    onJoin(socket, code) {
        if (socket.sessionResumed) {
            socket.sessionResumed = false;
            return;
        }
        const room = this.rooms[code.toUpperCase()];
        if (!room) { socket.emit("ROOM_NOT_FOUND"); return; }
        if (Object.keys(room.users).length >= this.config.room.maxPlayers) { socket.emit("ROOM_FULL"); return; }

        if (socket.roomId) { this._leaveRoom(socket); }

        socket.roomId = room.id;
        socket.join(room.id);

        const loginOrder = Object.keys(room.users).length + 1;
        const user = this._createUserEntry(socket.id, loginOrder, socket.sessionId);
        room.users[socket.id] = user;
        room.match.numberOfUsers++;

        // Send ROOM_JOINED first so client can reset state before receiving users
        socket.emit("ROOM_JOINED", JSON.stringify({ roomId: room.id, hostId: room.hostId, matchSettings: room.matchSettings }));
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
        socket.on("ON_USER_UPDATE_NAME",   (data) => this.onUpdateName(socket, data));
        socket.on("ON_PARTICLE",           (data) => this.onParticle(socket, data));
        socket.on("ON_SOUND",              (data) => this.onSound(socket, data));
    }

    onTick(socket, updatedUser) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        user.localPlayer.position.x    = updatedUser.localPlayer.position.x;
        user.localPlayer.position.y    = updatedUser.localPlayer.position.y;
        user.localPlayer.currentSprite = updatedUser.localPlayer.currentSprite;
        user.localPlayer.flipped       = updatedUser.localPlayer.flipped;
        if (updatedUser.localPlayer.velocity) {
            user.localPlayer.velocity = updatedUser.localPlayer.velocity;
        }
        const placeable = updatedUser.placeableObject;
        if (placeable && user.placeableObject.chose && !user.placeableObject.placed &&
            placeable.crateIndex === user.placeableObject.crateIndex && placeable.position &&
            Number.isFinite(placeable.position.x) && Number.isFinite(placeable.position.y)) {
            user.placeableObject.position = { ...placeable.position };
            if (Number.isFinite(placeable.rotation)) user.placeableObject.rotation = placeable.rotation;
            if (typeof placeable.objectId === 'string') user.placeableObject.objectId = placeable.objectId;
            user.placeableObject.hasExplosion = placeable.hasExplosion === true;
        }
        user.cursor.position.x          = updatedUser.cursor.position.x;
        user.cursor.position.y          = updatedUser.cursor.position.y;
    }

    onParticle(socket, data) {
        const room = this._getRoom(socket);
        if (!room) return;
        const { key, options, position } = JSON.parse(data);
        socket.broadcast.to(room.id).emit('ON_PARTICLE', JSON.stringify({ userId: socket.id, key, options, position }));
    }

    onSound(socket, data) {
        const room = this._getRoom(socket);
        if (!room) return;
        const { id, position } = JSON.parse(data);
        socket.broadcast.to(room.id).emit('ON_SOUND', JSON.stringify({ id, position }));
    }

    onUpdateName(socket, name) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;
        if (typeof name !== 'string') return;
        user.name = name.slice(0, 16);
        socket.to(room.id).emit("ON_USER_UPDATE_NAME", JSON.stringify({ id: socket.id, name: user.name }));
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
        user.localPlayer.deathType = localPlayer.deathType;
        user.localPlayer.lives = localPlayer.lives;
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
        socket.on("ON_REMOVE_PLACED_OBJECTS", (placementIds) => this.onRemovePlacedObjects(socket, placementIds));
        socket.on("ON_USER_ACTIVE_MAP", (mapName) => this.onActiveMap(socket, mapName));
    }

    onRemovePlacedObjects(socket, removal) {
        const room = this._getRoom(socket);
        if (!room || !room.users[socket.id] || !removal || typeof removal !== 'object') return;

        const removedIds = new Set(
            Array.isArray(removal.removedPlacementIds)
                ? removal.removedPlacementIds.filter(id => typeof id === 'string')
                : []
        );
        const explodedPlacementId = typeof removal.explodedPlacementId === 'string'
            ? removal.explodedPlacementId
            : undefined;
        if (explodedPlacementId) removedIds.add(explodedPlacementId);

        if (removedIds.size) {
            room.match.placedObjectsHistory = room.match.placedObjectsHistory.filter(
                object => !removedIds.has(object.placementId)
            );
        }

        if (!explodedPlacementId) return;
        for (const user of Object.values(room.users)) {
            const placeableObject = user.placeableObject;
            if (placeableObject?.placementId !== explodedPlacementId) continue;

            Object.assign(placeableObject, {
                chose: false,
                placed: false,
                crateIndex: undefined,
                objectId: undefined,
                placementId: undefined,
                hasExplosion: false,
                rotation: 0
            });
            this.io.to(room.id).emit('ON_USER_UPDATE_PLACEABLEOBJECT', JSON.stringify({
                id: user.id,
                placeableObject: { ...placeableObject }
            }));
        }
    }

    onActiveMap(socket, mapName) {
        const room = this._getRoom(socket);
        if (!room || typeof mapName !== 'string') return;
        room.activeMapName = mapName;
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
        user.placeableObject.position   = updatedPlaceableObject.position
            ? { ...updatedPlaceableObject.position }
            : updatedPlaceableObject.position;
        user.placeableObject.rotation   = updatedPlaceableObject.rotation;
        user.placeableObject.objectId   = updatedPlaceableObject.objectId;
        user.placeableObject.hasExplosion = updatedPlaceableObject.hasExplosion === true;

        if (user.placeableObject.placed && typeof user.placeableObject.objectId === 'string' &&
            user.placeableObject.position && Number.isFinite(user.placeableObject.position.x) &&
            Number.isFinite(user.placeableObject.position.y)) {
            const roundKey = room.match.seed ?? room.match.roundNumber;
            user.placeableObject.placementId = `${user.sessionId || socket.id}:${roundKey}`;
            if (!user.placeableObject.hasExplosion) {
                const placedObject = {
                    placementId: user.placeableObject.placementId,
                    objectId: user.placeableObject.objectId,
                    position: { ...user.placeableObject.position },
                    rotation: Number.isFinite(user.placeableObject.rotation) ? user.placeableObject.rotation : 0
                };
                const existingIndex = room.match.placedObjectsHistory.findIndex(
                    object => object.placementId === placedObject.placementId
                );
                if (existingIndex === -1) room.match.placedObjectsHistory.push(placedObject);
                else room.match.placedObjectsHistory[existingIndex] = placedObject;
            }
        } else {
            user.placeableObject.placementId = updatedPlaceableObject.placementId;
        }

        this.io.to(room.id).emit("ON_USER_UPDATE_PLACEABLEOBJECT", JSON.stringify({
            id: user.id,
            placeableObject: { ...user.placeableObject }
        }));

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
        socket.on("ON_USER_VOTE", (vote) => this.onVote(socket, vote));
    }

    onVote(socket, vote) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        user.vote = vote;
        socket.to(room.id).emit("ON_USER_VOTE_UPDATE", JSON.stringify({ userId: socket.id, vote }));
    }

    // ===== Match =====

    setupMatchHandlers(socket) {
        socket.on("ON_USER_JOIN_MATCH",           () =>     this.onJoinMatch(socket));
        socket.on("ON_USER_CHANGE_MATCH_STATE",   (data) => this.onChangeMatch(socket, data));
        socket.on("ON_UPDATE_MATCH_SETTINGS",     (data) => this.onUpdateMatchSettings(socket, data));
    }

    onJoinMatch(socket) {
        const room = this._getRoom(socket);
        if (!room) return;
        room.match.whenSyncedUsers(() => {
            room.match.update({ io: this.io.to(room.id), users: room.users }, "choosing");
            this.io.to(room.id).emit("ON_START_MATCH");
        });
    }

    onChangeMatch(socket, updatedState) {
        const room = this._getRoom(socket);
        if (!room) return;
        room.match.whenSyncedUsers(() => {
            room.match.update({ io: this.io.to(room.id), users: room.users }, updatedState);
            this.io.to(room.id).emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
        });
    }

    onUpdateMatchSettings(socket, data) {
        const room = this._getRoom(socket);
        if (!room || room.hostId !== socket.id) return;
        try {
            const settings = JSON.parse(data);
            room.matchSettings = settings;
            this.io.to(room.id).emit("ON_MATCH_SETTINGS_UPDATE", JSON.stringify(settings));
        } catch {}
    }

    // ===== Chat =====

    setupChatHandlers(socket) {
        socket.on('CHAT_MESSAGE', (message) => this.onChatMessage(socket, message));
    }

    onChatMessage(socket, message) {
        const room = this._getRoom(socket);
        if (!room) return;
        if (typeof message !== 'string' || message.length === 0 || message.length > 64) return;
        this.io.to(room.id).emit('ON_CHAT_MESSAGE', JSON.stringify({ userId: socket.id, message }));
    }

    // ===== Helpers =====

    _calculatePoints(room) {
        const userList = Object.values(room.users);
        const anyDied = userList.some(u => u.localPlayer.dead);
        if (!anyDied) return;
        for (const user of userList) {
            if (!user.localPlayer.dead) { user.points.victories++; }
        }

        // Check for match winner
        const pointsToWin = room.matchSettings?.pointsToWin ?? 5;
        const winner = userList.find(u => u.points.victories >= pointsToWin);
        if (winner) {
            this.io.to(room.id).emit("ON_MATCH_WINNER", JSON.stringify({ winnerId: winner.id }));
        }
    }


    _leaveRoom(socket) {
        const room = this._getRoom(socket);
        if (!room) return;
        const user = room.users[socket.id];
        if (!user) return;

        const pending = room.disconnectedSessions?.[user.sessionId];
        if (pending) {
            clearTimeout(pending.timeout);
            delete room.disconnectedSessions[user.sessionId];
        }

        for (let i in room.users) {
            if (room.users[i].loginOrder > user.loginOrder) { room.users[i].loginOrder -= 1; }
        }
        delete room.users[socket.id];
        room.match.numberOfUsers--;

        socket.to(room.id).emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify({
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

    _createUserEntry(socketId, loginOrder, sessionId) {
        return {
            id: socketId,
            sessionId,
            loginOrder,
            name:            '',
            vote:            null,
            localPlayer:     { id: undefined, position: { x: undefined, y: undefined }, velocity: { x: 0, y: 0 }, loaded: false, finished: false, dead: false, deathType: 'default', flipped: false, lives: 0 },
            characterOption: { id: undefined },
            placeableObject: { position: { x: 0, y: 0 }, crateIndex: undefined, objectId: undefined, placementId: undefined, hasExplosion: false, chose: false, placed: false, rotation: 0 },
            points:          { victories: 0 },
            cursor:          { position: { x: 0, y: 0 }, gridPosition: { x: 0, y: 0 }, previousGridPosition: { x: 0, y: 0 } }
        };
    }
}

module.exports = { SocketServer };
