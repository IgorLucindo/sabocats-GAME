// user connect event
function onConnection({socket, io, users, match}){
    console.log(`[${socket.id}] LOG:USER_CONNECTED`);

    // create user
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

    // sort users by login order for client broadcast
    const sortedUsersArray = Object.values(users).sort((a, b) => a.loginOrder - b.loginOrder);
    const sortedUsers = sortedUsersArray.reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});

    // send users to client
    io.emit("ON_USER_CONNECT", JSON.stringify(sortedUsers));

    // update number of users
    match.numberOfUsers++;
};



// user disconnect event
function onDisconnection({socket, io, users, match}){
    socket.on("disconnect", () => {
        console.log(`[${socket.id}] LOG:USER_DISCONNECTED`);

        const user = users[socket.id];

        // update other login orders
        for(let i in users){
            if(users[i].loginOrder > user.loginOrder){users[i].loginOrder -= 1;}
        };

        // send deleted user to client
        io.emit("ON_USER_DISCONNECT_UPDATE", JSON.stringify(user));

        // delete user
        delete users[socket.id];

        // update number of users
        match.numberOfUsers--;
    });
};



// export functions
module.exports = {onConnection, onDisconnection};