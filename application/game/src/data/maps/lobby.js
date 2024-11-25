function createLobby(){
    const background = new BackgroundLayered({
        width: 1280,
        height: 840,
        images: {},
        objects: {
            house: {position:{x: 0, y: 20}, imageSrc: "assets/images/maps/lobby/house.png"}
        }
    });
    const grid = null;
    const staticBackground = new Sprite({position: {x: 0, y: 0}, imageSrc: "assets/images/maps/lobby/sky.png"});
    
    
    // properties
    var allCollisionBlocks = [];
    var allInteractableAreas = [];
    
    // collision blocks
    const floor = new CollisionBlock({position: {x: 0, y: 794}, width: background.width, height: 30});
    allCollisionBlocks.push(floor);
    const houseRoof1 = new CollisionBlock({position: {x: 200, y: 250}, width: 580, height: 20});
    allCollisionBlocks.push(houseRoof1);
    const houseRoof2 = new CollisionBlock({position: {x: 250, y: 194}, width: 360, height: 50});
    allCollisionBlocks.push(houseRoof2);
    const test = new CollisionBlock({position: {x: 900, y: 250}, width: 20, height: 500});
    allCollisionBlocks.push(test);

    // interactable areas
    const mapBoard = new InteractableArea({
        position: {x: 1050, y: floor.position.y - 175},
        hitbox: {width: 140, height: 175},
        imageSrc: "assets/images/maps/lobby/mapBoard.png",
        scale: background.scale,
        pressable: true,
        highlightable: true,
        func: () => {openMapMenu();}
    });
    allInteractableAreas.push(mapBoard);

    return [
        background, staticBackground, grid,
        allCollisionBlocks, allInteractableAreas
    ];
};
