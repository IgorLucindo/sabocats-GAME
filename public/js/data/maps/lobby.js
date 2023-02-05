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
    const scaleLobby = 1 * canvas.width / 1024;
    const playerScaleLobby = .2;
    var allCollisionBlocksLobby = [];
    var allInteractableAreasLobby = [];
    const tileSize = 240 * playerScaleLobby;
    
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
        position: {x: 1000, y: floorLobby.position.y - 200},
        hitbox: {width: 200, height: 200},
        imageSrc: "../assets/images/maps/lobby/house.png",
        scale: .2,
        method: () => {openMapMenu();}
    });
    allInteractableAreasLobby.push(mapBoard);

    return [
        lobby, staticBackgroundLobby, gridLobby,
        allCollisionBlocksLobby, allInteractableAreasLobby,
        playerScaleLobby, scaleLobby, tileSize
    ];
};
