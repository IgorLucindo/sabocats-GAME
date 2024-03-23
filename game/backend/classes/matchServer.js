// match server class
class MatchServer{
    constructor(){
        this.state = undefined;
        this.totalJoinedPlayers = 0;
    };



    // process depending on match state
    processState({io}){
        switch(this.state){
            case "choosing":
                this.sendBoxSeed({io});
                return;
            case "placing":
                // Call function or trigger event for paused state
                return;
            case "playing":
                // Call function or trigger event for game over state
                return;
            default:
                console.error("Invalid game state");
        };
    };



    // create and send box seed to client
    sendBoxSeed({io}){
        const totalObjects = 4;
        const seed = Array(totalObjects).fill(0);
        for(let i = 0; i < totalObjects; i++){
            seed[i] = Math.floor(Math.random() * 5);
        };
        io.emit("ON_GENERATE_BOX_OBJECTS", JSON.stringify(seed));
    };
};



// export class
module.exports = {MatchServer};