// user connect event
function onConnection({socket, io, users}){
    console.log(`[${socket.id}] LOG:USER_CONNECTED`);
    users[socket.id] = {
        id: socket.id,
        loginOrder: Object.keys(users).length + 1,
        onlinePlayer: {id: undefined, position: {x: undefined, y: undefined}, loaded: false, finished: false, dead: false},
        onlineSelectablePlayer: {id: undefined},
        chooseMap: {current: undefined, previous: undefined},
        boxObject: {position: {x: 0, y: 0}, boxId: undefined, chose: false, placed: false, rotation: 0},
        points: {victories: 0},
        cursor: {position: {x: 0, y: 0}, gridPosition: {x: 0, y: 0}, previousGridPosition: {x: 0, y: 0}}
    };
    // sort users depending on login order
    const sortedUsersArray = Object.values(users).sort((a, b) => a.loginOrder - b.loginOrder);
    const sortedUsers = sortedUsersArray.reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    users = sortedUsers;
    io.emit("ON_USER_CONNECT", JSON.stringify(users));
};



// user disconnect event
function onDisconnection({socket, io, users}){
    socket.on("disconnect", () => {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);
        const user = users[socket.id];
        // update other login orders
        for(let i in users){
            if(users[i].loginOrder > user.loginOrder){users[i].loginOrder -= 1;}
        };
        // delete user
        io.emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify(user));
        delete users[socket.id];
    });
};



// export functions
module.exports = {onConnection, onDisconnection};