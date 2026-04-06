const fs   = require('fs');
const path = require('path');

class MatchServer {
    constructor({ maxPlayers }) {
        this.maxPlayers = maxPlayers;
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;

        const manifestPath = path.join(__dirname, '../../game/data/manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.placeableObjectNames = manifest.placeableObjects;
    }

    update({ io }, state) {
        switch(state){
            case "choosing":
                this.sendPlaceableObjectsSeed({ io });
                return;
            case "playing":
                this.sendSpawnSeed({ io });
                return;
            case "placing":
            case "scoreboard":
                return;
            default:
                console.error("Invalid game state");
        }
    }

    sendPlaceableObjectsSeed({ io }) {
        const seed = Array(this.maxPlayers).fill(0);
        for(let i = 0; i < this.maxPlayers; i++) {
            seed[i] = this.placeableObjectNames[Math.floor(Math.random() * this.placeableObjectNames.length)];
        }
        io.emit("ON_GENERATE_PLACEABLEOBJECTS", JSON.stringify(seed));
    }

    sendSpawnSeed({ io }) {
        // Create permutation of [0, 1, 2, ..., numPlayers-1]
        const seed = Array.from({length: this.numberOfUsers}, (_, i) => i);

        // Fisher-Yates shuffle
        for (let i = seed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [seed[i], seed[j]] = [seed[j], seed[i]];
        }

        io.emit("ON_GENERATE_SPAWN_POSITIONS", JSON.stringify(seed));
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