function createLobby(){
    const lobby = new BackgroundLayered({
        width: 1280,
        height: 840,
        images: {},
        objects: {
            house: {position:{x: 0, y: 20}, imageSrc: "../assets/images/maps/lobby/house.png"}
        }
    });
    const gridLobby = null;
    const staticBackgroundLobby = new Sprite({position: {x: 0, y: 0}, imageSrc: "../assets/images/maps/lobby/sky.png"});
    
    
    // lobby properties
    const scaleLobby = 1;
    const playerScaleLobby = 1 / scaleLobby;
    var allCollisionBlocksLobby = [];
    var allInteractableAreasLobby = [];
    const tileSizeLobby = TILE_SIZE;
    
    // lobby collision blocks
    const floorLobby = new CollisionBlock({position: {x: 0, y: 794}, width: lobby.width, height: 30});
    allCollisionBlocksLobby.push(floorLobby);
    const houseRoofLobby1 = new CollisionBlock({position: {x: 200, y: 250}, width: 580, height: 20});
    allCollisionBlocksLobby.push(houseRoofLobby1);
    const houseRoofLobby2 = new CollisionBlock({position: {x: 250, y: 194}, width: 360, height: 50});
    allCollisionBlocksLobby.push(houseRoofLobby2);
    const test = new CollisionBlock({position: {x: 900, y: 250}, width: 20, height: 500});
    allCollisionBlocksLobby.push(test);

    // lobby interactable areas
    const mapBoard = new InteractableArea({
        position: {x: 1050, y: floorLobby.position.y - 175},
        hitbox: {width: 140, height: 175},
        imageSrc: "../assets/images/maps/lobby/mapBoard.png",
        scale: scaleLobby,
        playerScale: playerScaleLobby,
        pressable: true,
        highlightable: true,
        method: () => {openMapMenu();}
    });
    allInteractableAreasLobby.push(mapBoard);

    return [
        lobby, staticBackgroundLobby, gridLobby,
        allCollisionBlocksLobby, allInteractableAreasLobby,
        playerScaleLobby, scaleLobby, tileSizeLobby
    ];
};
