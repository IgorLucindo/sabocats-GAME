function createForest(){
    const background = new BackgroundLayered({
        width: 928,
        height: 400,
        images: {
            image1: {imageSrc: "assets/images/maps/forest/forest1.png", parallaxSpeed: .5},
            image2: {imageSrc: "assets/images/maps/forest/forest2.png", parallaxSpeed: .5},
            image3: {imageSrc: "assets/images/maps/forest/forest3.png", parallaxSpeed: .3},
            image4: {imageSrc: "assets/images/maps/forest/forest4.png", parallaxSpeed: .3},
            image5: {imageSrc: "assets/images/maps/forest/forest5.png", parallaxSpeed: .2},
            image6: {imageSrc: "assets/images/maps/forest/forest6.png", parallaxSpeed: .2},
            image7: {imageSrc: "assets/images/maps/forest/forest7.png"},
            grid: {imageSrc: "assets/images/maps/forest/gridForest.png", grid: true},
            image8: {imageSrc: "assets/images/maps/forest/forest8.png", front: true},
            image9: {imageSrc: "assets/images/maps/forest/forest9.png", front: true},
            image10: {imageSrc: "assets/images/maps/forest/forest10.png", front: true}
        },
        objects: {},
        scale: 2
    });
    const grid = {position: {x: 2, y: 0}};
    const staticBackground = null;
    
    
    const allCollisionBlocks = [];
    let allInteractableAreas = [];
    
    
    const startArea = {
        position: {x: grid.position.x + data.tileSize*1, y: grid.position.y + data.tileSize*10},
        width: data.tileSize * 5,
        height: data.tileSize * 3
    };
    const finishArea = new InteractableArea({
        position: {x: grid.position.x + data.tileSize*30, y: grid.position.y + data.tileSize*11},
        hitbox: {width: data.tileSize*5, height: data.tileSize*3},
        imageSrc: "assets/images/maps/lobby/house.png",
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
        height: data.tileSize
    });
    allCollisionBlocks.push(floor);


    return [
        background, staticBackground, grid,
        startArea, allCollisionBlocks, allInteractableAreas
    ];
};
