class MatchServer {
    constructor(){
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;
    }

    update({io}, state){
        switch(state){
            case "choosing":
                this.sendPlaceableObjectsSeed({io});
                return;
            case "placing":
            case "playing":
            case "scoreboard":
                return;
            default:
                console.error("Invalid game state");
        }
    }

    sendPlaceableObjectsSeed({io}){
        const totalObjects = 4;
        const numberOfObjects = 6; // IDs 0-5
        const seed = Array(totalObjects).fill(0);
        for(let i = 0; i < totalObjects; i++){
            seed[i] = Math.floor(Math.random() * numberOfObjects);
        }
        io.emit("ON_GENERATE_PLACEABLEOBJECTS", JSON.stringify(seed));
    }

    whenSyncedUsers(func){
        this.numberOfSyncedUsers++;
        if(this.numberOfSyncedUsers === this.numberOfUsers){
            this.numberOfSyncedUsers = 0;
            func();
        }
    }
}

module.exports = {MatchServer};
