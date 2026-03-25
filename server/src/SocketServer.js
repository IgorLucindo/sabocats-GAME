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
            this.io.emit("ON_USER_UPDATE", JSON.stringify(this.users));
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
            boxObject: { position: { x: 0, y: 0 }, boxId: undefined, chose: false, placed: false, rotation: 0 },
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
        socket.on("ON_TICK",               (data) => this.onTick(socket, data));
        socket.on("ON_USER_CHOOSE_PLAYER", (data) => this.onChoosePlayer(socket, data));
        socket.on("ON_USER_PLAYER_UNLOAD", ()     => this.onUnloadPlayer(socket));
        socket.on("ON_USER_PLAYER_FINISH", (data) => this.onFinishPlayer(socket, data));
    }

    onTick(socket, updatedUser) {
        const user = this.users[socket.id];
        user.onlinePlayer.position.x    = updatedUser.onlinePlayer.position.x;
        user.onlinePlayer.position.y    = updatedUser.onlinePlayer.position.y;
        user.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
        user.cursor.position.x          = updatedUser.cursor.position.x;
        user.cursor.position.y          = updatedUser.cursor.position.y;
    }

    onChoosePlayer(socket, updatedUser) {
        const user = this.users[socket.id];
        user.onlinePlayer.id             = updatedUser.onlinePlayer.id;
        user.onlinePlayer.loaded         = true;
        user.onlineSelectablePlayer.id   = updatedUser.onlineSelectablePlayer.id;
        socket.broadcast.emit("ON_USER_CHOOSE_PLAYER_UPDATE", JSON.stringify(user));
    }

    onUnloadPlayer(socket) {
        const user = this.users[socket.id];
        user.onlinePlayer.loaded = false;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));
    }

    onFinishPlayer(socket, playerDead) {
        const user = this.users[socket.id];
        user.onlinePlayer.loaded   = false;
        user.onlinePlayer.finished = true;
        user.onlinePlayer.dead     = playerDead;
        socket.broadcast.emit("ON_USER_PLAYER_UPDATE", JSON.stringify(user));

        this.match.whenSyncedUsers(() => {
            const updatedState = "scoreboard";
            this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            this.match.update({ io: this.io }, updatedState);
        });
    }

    // ===== Objects =====

    setupObjectHandlers(socket) {
        socket.on("ON_USER_CHOOSE_OBJECT", (data) => this.onChooseObject(socket, data));
        socket.on("ON_USER_PLACE_OBJECT",  (data) => this.onPlaceObject(socket, data));
        socket.on("ON_USER_ROTATE_OBJECT", (data) => this.onRotateObject(socket, data));
    }

    onChooseObject(socket, updatedBoxObjectId) {
        const user = this.users[socket.id];
        user.boxObject.chose = true;
        socket.broadcast.emit("ON_USER_CHOOSE_OBJECT_UPDATE", JSON.stringify([user.id, updatedBoxObjectId]));

        this.match.whenSyncedUsers(() => {
            const updatedState = "placing";
            this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            this.match.update({ io: this.io }, updatedState);
        });
    }

    onPlaceObject(socket, updatedBoxObject) {
        const user = this.users[socket.id];
        user.boxObject = updatedBoxObject;
        socket.broadcast.emit("ON_USER_PLACE_OBJECT_UPDATE", JSON.stringify({ id: user.id, boxObject: updatedBoxObject }));

        this.match.whenSyncedUsers(() => {
            const updatedState = "playing";
            this.io.emit("ON_CHANGE_MATCH_STATE", JSON.stringify(updatedState));
            this.match.update({ io: this.io }, updatedState);
        });
    }

    onRotateObject(socket, updatedBoxObject) {
        const user = this.users[socket.id];
        user.boxObject.rotation = updatedBoxObject;
        socket.broadcast.emit("ON_USER_ROTATE_OBJECT_UPDATE", JSON.stringify({ id: user.id, boxObject: updatedBoxObject }));
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
