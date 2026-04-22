const fs   = require('fs');
const path = require('path');

class MatchServer {
    constructor({ maxPlayers }) {
        this.maxPlayers = maxPlayers;
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;
    }

    update({ io, users }, state) {
        switch(state){
            case "choosing":
                this.sendSeed({ io });
                this._resetPlaceableObjects(users);
                return;
            case "lobby":
                this._resetVictories(users);
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

    _resetPlaceableObjects(users) {
        for (const id in users) {
            users[id].placeableObject.chose      = false;
            users[id].placeableObject.placed     = false;
            users[id].placeableObject.crateIndex = undefined;
            users[id].placeableObject.rotation   = 0;
        }
    }

    _resetVictories(users) {
        for (const id in users) { users[id].points.victories = 0; }
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