// SocketServer - Centralized socket event handling (mirrors client SocketHandler)

class SocketServer {
    constructor(io, users, match) {
        this.io = io;
        this.users = users;
        this.match = match;
    }

    initialize() {
        this.io.on('connection', (socket) => {
            this.onConnection(socket);
            this.setupConnectionHandlers(socket);
            this.setupUserHandlers(socket);
            this.setupObjectHandlers(socket);
            this.setupMapHandlers(socket);
            this.setupMatchHandlers(socket);
        });

        // Tick broadcast — created once, not per connection
        setInterval(() => {
            this.io.emit("ON_TICK", JSON.stringify(this.users));
        }, 15);
    }

    // ===== Connection =====

    setupConnectionHandlers(socket) {
        socket.on('disconnect', () => this.onDisconnect(socket));
    }

    onConnection(socket) {
        console.log(`[${socket.id}] LOG:USER_CONNECTED`);
        const { users, match } = this;

        users[socket.id] = {
            id: socket.id,
            loginOrder: Object.keys(users).length + 1,
            onlinePlayer: { id: undefined, position: { x: undefined, y: undefined }, loaded: false, finished: false, dead: false },
            onlineSelectablePlayer: { id: undefined },
            chooseMap: { current: undefined, previous: undefined },
            boxObject: { position: { x: 0, y: 0 }, crateIndex: undefined, chose: false, placed: false, rotation: 0 },
            points: { victories: 0 },
            cursor: { position: { x: 0, y: 0 }, gridPosition: { x: 0, y: 0 }, previousGridPosition: { x: 0, y: 0 } }
        };

        const sortedUsersArray = Object.values(users).sort((a, b) => a.loginOrder - b.loginOrder);
        const sortedUsers = sortedUsersArray.reduce((acc, obj) => { acc[obj.id] = obj; return acc; }, {});
        this.io.emit("ON_USER_CONNECT", JSON.stringify(sortedUsers));

        match.numberOfUsers++;
    }

    onDisconnect(socket) {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        const { users, match } = this;

        const user = users[socket.id];
        for (let i in users) {
            if (users[i].loginOrder > user.loginOrder) { users[i].loginOrder -= 1; }
        }
        this.io.emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify(user));
        delete users[socket.id];

        match.numberOfUsers--;
    }

    // ===== Users =====

    setupUserHandlers(socket) {
        socket.on("ON_TICK",                  (data) => this.onTick(socket, data));
        socket.on("ON_USER_UPDATE_PLAYER",    (data) => this.onUpdatePlayer(socket, data));
    }

    onTick(socket, updatedUser) {
        const user = this.users[socket.id];
        user.onlinePlayer.position.x    = updatedUser.onlinePlayer.position.x;
        user.onlinePlayer.position.y    = updatedUser.onlinePlayer.position.y;
        user.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
        user.cursor.position.x          = updatedUser.cursor.position.x;
        user.cursor.position.y          = updatedUser.cursor.position.y;
    }

    onUpdatePlayer(socket, updatedPlayerData) {
        const user = this.users[socket.id];
        const { onlinePlayer, onlineSelectablePlayer } = updatedPlayerData;

        // Sync player state
        user.onlinePlayer.id = onlinePlayer.id;
        user.onlinePlayer.loaded = onlinePlayer.loaded;
        user.onlinePlayer.finished = onlinePlayer.finished;
        user.onlinePlayer.dead = onlinePlayer.dead;
        user.onlineSelectablePlayer.id = onlineSelectablePlayer.id;

        socket.broadcast.emit("ON_USER_UPDATE_PLAYER", JSON.stringify({
            id: user.id,
            onlinePlayer: user.onlinePlayer,
            onlineSelectablePlayer: user.onlineSelectablePlayer
        }));

        // Trigger state transitions
        if (onlinePlayer.loaded) {
            this.match.whenSyncedUsers(() => {
                const updatedState = "placing";
                this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
                this.match.update({ io: this.io }, updatedState);
            });
        }

        if (onlinePlayer.finished) {
            this.match.whenSyncedUsers(() => {
                const updatedState = "scoreboard";
                this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
                this.match.update({ io: this.io }, updatedState);
            });
        }
    }

    // ===== Objects =====

    setupObjectHandlers(socket) {
        socket.on("ON_USER_UPDATE_PLACEABLEOBJECT", (data) => this.onUpdatePlaceableObject(socket, data));
    }

    onUpdatePlaceableObject(socket, updatedPlaceableObject) {
        const user = this.users[socket.id];
        user.boxObject.crateIndex = updatedPlaceableObject.crateIndex;
        user.boxObject.chose = updatedPlaceableObject.chose;
        user.boxObject.placed = updatedPlaceableObject.placed;
        user.boxObject.position = updatedPlaceableObject.position;
        user.boxObject.rotation = updatedPlaceableObject.rotation;

        socket.broadcast.emit("ON_USER_UPDATE_PLACEABLEOBJECT", JSON.stringify({ id: user.id, placeableObject: updatedPlaceableObject }));

        // Transition to placing when first object is chosen
        if (updatedPlaceableObject.chose) {
            this.match.whenSyncedUsers(() => {
                const updatedState = "placing";
                this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
                this.match.update({ io: this.io }, updatedState);
            });
        }

        // Transition to playing when all objects are placed
        if (updatedPlaceableObject.placed) {
            this.match.whenSyncedUsers(() => {
                const updatedState = "playing";
                this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
                this.match.update({ io: this.io }, updatedState);
            });
        }
    }

    // ===== Map =====

    setupMapHandlers(socket) {
        socket.on("ON_USER_CHOOSE_MAP", (data) => this.onChooseMap(socket, data));
    }

    onChooseMap(socket, updatedChooseMap) {
        socket.broadcast.emit("ON_USER_CHOOSE_MAP_UPDATE", JSON.stringify(updatedChooseMap));
    }

    // ===== Match =====

    setupMatchHandlers(socket) {
        socket.on("ON_USER_JOIN_MATCH",         ()     => this.onJoinMatch());
        socket.on("ON_USER_CHANGE_MATCH_STATE", (data) => this.onChangeMatch(data));
    }

    onJoinMatch() {
        this.match.whenSyncedUsers(() => {
            this.io.emit("ON_START_MATCH");
            this.match.update({ io: this.io }, "choosing");
        });
    }

    onChangeMatch(updatedState) {
        this.match.whenSyncedUsers(() => {
            this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            this.match.update({ io: this.io }, updatedState);
        });
    }
}

module.exports = { SocketServer };
