class MatchServer {
    constructor({ maxPlayers }) {
        this.maxPlayers = maxPlayers;
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;
        this.currentState = 'lobby';
        this.seed = undefined;
        // Objects placed in past rounds of the current match — needed so a client that
        // reconnects mid-match can rebuild everything placed so far, not just the current round.
        this.placedObjectsHistory = [];
        this.roundNumber = 0;
    }

    update({ io, users }, state) {
        this.currentState = state;
        switch(state){
            case "choosing":
                this.roundNumber++;
                this.sendSeed({ io });
                this._resetPlaceableObjects(users);
                return;
            case "lobby":
                this._resetVictories(users);
                this.placedObjectsHistory = [];
                this.roundNumber = 0;
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
        this.seed = seed;
        io.emit("ON_SEED", JSON.stringify(seed));
    }

    _resetPlaceableObjects(users) {
        for (const id in users) {
            users[id].placeableObject.chose      = false;
            users[id].placeableObject.placed     = false;
            users[id].placeableObject.crateIndex = undefined;
            users[id].placeableObject.rotation   = 0;
            users[id].placeableObject.objectId   = undefined;
            users[id].placeableObject.placementId = undefined;
            users[id].placeableObject.hasExplosion = false;
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