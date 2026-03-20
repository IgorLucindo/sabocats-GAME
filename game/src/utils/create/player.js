// create player
function createPlayer({id, position, selectablePlayer = null}){
    // Player creation is now handled by the PlayerControlSystem
    // This function maintains compatibility with existing code
    const player = new Player({
        position: position,
        animations: data.characters[id],
        selectablePlayer: selectablePlayer
    });

    return player;
};



// create online player
function createOnlinePlayer({id, position = {x: 0, y: 0}, currentSprite = "idleSit"}){
    const onlinePlayer = new OnlinePlayer({
        position: position,
        animations: data.characters[id],
        currentSprite: currentSprite
    });

    return onlinePlayer;
};