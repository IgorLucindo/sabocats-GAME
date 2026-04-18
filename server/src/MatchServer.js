const fs   = require('fs');
const path = require('path');

class MatchServer {
    constructor({ maxPlayers }) {
        this.maxPlayers = maxPlayers;
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;
    }

    update({ io }, state) {
        switch(state){
            case "choosing":
                this.sendSeed({ io });
                return;
            case "initial":
            case "playing":
            case "placing":
            case "scoreboard":
                return;
            default:
                console.error("Invalid game state");
        }
    }

    sendSeed({ io }) {
        const seed = Math.floor(Math.random() * 0x7fffffff);
        io.emit("ON_SEED", JSON.stringify(seed));
    }

    whenSyncedUsers(func) {
        this.numberOfSyncedUsers++;
        if(this.numberOfSyncedUsers === this.numberOfUsers){
            this.numberOfSyncedUsers = 0;
            func();
        }
    }
}

module.exports = { MatchServer };