// start round
function startRound(){
    background.gridLayer.loadLayer = false;
    camera.position.x = 0;
    camera.position.y = scaledCanvas.height - background.height;

    let randomNums = [0/3, 1/3, 2/3, 3/3];
    randomNums.sort(() => Math.random() - 0.5);
    // reset player
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.position.x =
    startArea.position.x - (player.width-player.hitbox.width)/2 + (startArea.width-player.hitbox.width)*randomNums[0];
    player.position.y =
    startArea.position.y + startArea.height - (player.height+player.hitbox.height)/2 - 5;
    player.finished = false;
    player.loaded = true;
    // reset users online players
    for(let i in users){
        if(users[i].id != user.id){
            const onlinePlayer = users[i].onlinePlayer;
            onlinePlayer.finished = false;
            onlinePlayer.loaded = true;
        }
    };
    removeMouseEvents();
};



// finish round
function finishRound(){
    player.loaded = false;
    for(let i in users){
        if(users[i].id != user.id){users[i].onlinePlayer.loaded = false;}
    };
    background.gridLayer.loadLayer = true;
    camera.position.x = (scaledCanvas.width - background.width)/2;
    camera.position.y = (scaledCanvas.height - background.height)/2;
    box = new Box({objectsNumber: 4});
    resetMouseEvents();
};