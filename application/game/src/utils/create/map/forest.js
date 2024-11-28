function createForest(){
    const background = new BackgroundLayered({
        width: 928,
        height: 400,
        images: {
            image1: {texture: "assets/textures/maps/forest/forest1.png", parallaxSpeed: .5},
            image2: {texture: "assets/textures/maps/forest/forest2.png", parallaxSpeed: .5},
            image3: {texture: "assets/textures/maps/forest/forest3.png", parallaxSpeed: .3},
            image4: {texture: "assets/textures/maps/forest/forest4.png", parallaxSpeed: .3},
            image5: {texture: "assets/textures/maps/forest/forest5.png", parallaxSpeed: .2},
            image6: {texture: "assets/textures/maps/forest/forest6.png", parallaxSpeed: .2},
            image7: {texture: "assets/textures/maps/forest/forest7.png"},
            grid: {texture: "assets/textures/maps/forest/gridForest.png", grid: true},
            image8: {texture: "assets/textures/maps/forest/forest8.png", front: true},
            image9: {texture: "assets/textures/maps/forest/forest9.png", front: true},
            image10: {texture: "assets/textures/maps/forest/forest10.png", front: true}
        },
        objects: {},
        scale: 2
    });
    const grid = {position: {x: 2, y: 0}};
    const staticBackground = null;
    
    
    const allCollisionBlocks = [];
    let allInteractableAreas = [];
    
    const tileSize = properties.tileSize;
    const startArea = {
        position: {x: grid.position.x + tileSize*1, y: grid.position.y + tileSize*10},
        width: tileSize * 5,
        height: tileSize * 3
    };
    const finishArea = new InteractableArea({
        position: {x: grid.position.x + tileSize*30, y: grid.position.y + tileSize*11},
        hitbox: {width: tileSize*5, height: tileSize*3},
        texture: "assets/textures/maps/lobby/house.png",
        scale: .05,
        func: () => {
            if(!player.finished){
                player.loaded = false;
                player.finished = true;
                sendFinishedPlayerToServer();
            }
        }
    });
    allInteractableAreas.push(finishArea);


    const floor = new CollisionBlock({
        position: {x: 0, y: background.height - 128},
        width: background.width,
        height: tileSize
    });
    allCollisionBlocks.push(floor);


    return [
        background, staticBackground, grid,
        startArea, allCollisionBlocks, allInteractableAreas
    ];
};
