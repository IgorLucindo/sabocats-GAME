// match server class
class MatchServer{
    constructor(){
        this.numberOfUsers = 0;
        this.numberOfSyncedUsers = 0;
    };



    // update depending on match state
    update({io}, state){
        switch(state){
            case "choosing":
                this.sendBoxSeed({io});
                return;

            case "placing":
                return;

            case "playing":
                return;

            case "scoreboard":
                return;
            default:
                console.error("Invalid game state");
        };
    };



    // create and send box seed to client
    sendBoxSeed({io}){
        // create box seed
        const totalObjects = 4;
        const numberOfPossibleObjects = 5;
        const seed = Array(totalObjects).fill(0);
        for(let i = 0; i < totalObjects; i++){
            seed[i] = Math.floor(Math.random() * (numberOfPossibleObjects+1));
        };

        // send box seed to client
        io.emit("ON_GENERATE_BOX_OBJECTS", JSON.stringify(seed));
    };



    // execute func once all users are synced
    whenSyncedUsers(func){
        // syncing
        this.numberOfSyncedUsers++;

        // all synced
        if(this.numberOfSyncedUsers === this.numberOfUsers){
            this.numberOfSyncedUsers = 0;
            func();
        }
    };
};



// export class
module.exports = {MatchServer};