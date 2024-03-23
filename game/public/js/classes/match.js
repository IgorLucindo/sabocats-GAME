// match class
class Match{
    constructor(){
        this.state = undefined;
        this.previousState = undefined;

        this.inMatch = false;

        this.objectsChosed = 0;
        this.objectsPlaced = 0;
        this.playersFinished = 0;
    };
    
    
    
    // update
    update(){
        switch(this.state){
            case "choosing":
                this.checkChossingStateChange();
                return;
            case "placing":
                this.checkPlacingStateChange();
                return;
            case "playing":
                this.checkPlayingStateChange({waitTimer: 2, scoreBoardTimer: 3});
                return;
            default:
                console.error("Invalid game state");
        };
    };



    // update when change state
    updateInStateChange(){
        if(this.state === this.previousState){return;}

        switch(this.state){
            case "choosing":
                clearDivMenu();
                this.startChoosing();
                return;
            case "placing":
                // Call function or trigger event for paused state
                return;
            case "playing":
                this.startPlaying();
                return;
            default:
                console.error("Invalid game state");
        };
    };



    // join match
    join(){
        resetMapProperties();
        sendJoinMatchToServer();
    };



    // start match
    start(){
        this.inMatch = true;
        this.setState("choosing");
    };



    // start choosing state
    startChoosing(){
        user.boxObject.chose = false;
        user.boxObject.placed = false;
        for(let i in users){
            if(users[i].id != user.id){users[i].onlinePlayer.loaded = false;}
        };
        background.gridLayer.loadLayer = true;
        camera.setZoom(4/5);
        camera.moveCamera({key: "middle"});

        player.loaded = false;
        mouse.showCursor();
        resetMouseEvents();
    };


    // start playing state
    startPlaying(){
        camera.setZoom(1);
        camera.moveCamera({key: "start"});
        box.objects = [];

        let randomNums = [0/3, 1/3, 2/3, 3/3];
        randomNums.sort(() => Math.random() - 0.5);
        // reset player
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.position.x =
        startArea.position.x - (player.width-player.hitbox.width)/2 + (startArea.width-player.hitbox.width)*randomNums[0];
        player.position.y =
        startArea.position.y + startArea.height - (player.height+player.hitbox.height)/2 - 5;
        player.updateHitbox();
        player.dead = false;
        player.finished = false;
        player.loaded = true;
        // reset users
        for(let i in users){
            if(users[i].id != user.id){
                const onlinePlayer = users[i].onlinePlayer;
                onlinePlayer.finished = false;
                onlinePlayer.loaded = true;
                const boxObject = users[i].boxObject;
                boxObject.chose = false;
                boxObject.placed = false;
            }
        };
        removeMouseEvents();
    };



    // check ending of choosing state
    checkChossingStateChange(){
        const numberOfPlayers = Object.keys(users).length;
        if(this.objectsChosed === numberOfPlayers){
            this.objectsChosed = 0;
            this.setState("placing");
        }
    };


    // check ending of placing state
    checkPlacingStateChange(){
        const numberOfPlayers = Object.keys(users).length;
        if(this.objectsPlaced === numberOfPlayers){
            this.objectsPlaced = 0;
            this.setState("playing");
        }
    };



    // check ending of playing state
    checkPlayingStateChange({waitTimer, scoreBoardTimer}){
        const numberOfPlayers = Object.keys(users).length;
        if(this.playersFinished === numberOfPlayers){
            if(time1 < waitTimer){time1 += deltaTime;}
            else if(time2 < scoreBoardTimer){
                if(time2 == 0){
                    calculatePoints();
                    showScoreBoard();
                }
                time2 += deltaTime;
            }
            else{
                this.playersFinished = 0;
                match.setState("choosing");
                time1 = 0;
                time2 = 0;
            }
        }
    };


    
    // set game state
    setState(newState){
        this.state = newState;
    };
};