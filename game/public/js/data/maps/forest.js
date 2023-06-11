function createForest(){
    const forest = new BackgroundLayered({
        width: 928,
        height: 400,
        images: {
            image1: {imageSrc: "../assets/images/maps/forest/forest1.png", parallaxSpeed: .5},
            image2: {imageSrc: "../assets/images/maps/forest/forest2.png", parallaxSpeed: .5},
            image3: {imageSrc: "../assets/images/maps/forest/forest3.png", parallaxSpeed: .3},
            image4: {imageSrc: "../assets/images/maps/forest/forest4.png", parallaxSpeed: .3},
            image5: {imageSrc: "../assets/images/maps/forest/forest5.png", parallaxSpeed: .2},
            image6: {imageSrc: "../assets/images/maps/forest/forest6.png", parallaxSpeed: .2},
            image7: {imageSrc: "../assets/images/maps/forest/forest7.png"},
            gridForest: {imageSrc: "../assets/images/maps/forest/gridForest.png", grid: true},
            image8: {imageSrc: "../assets/images/maps/forest/forest8.png", front: true},
            image9: {imageSrc: "../assets/images/maps/forest/forest9.png", front: true},
            image10: {imageSrc: "../assets/images/maps/forest/forest10.png", front: true}
        }
    });
    const gridForest = {position: {x: 8, y: 8}};
    const staticBackgroundForest = null;
    
    
    const scaleForest = 2;
    const playerScaleForest = 1 / scaleForest;
    const allCollisionBlocksForest = [];
    var allInteractableAreasForest = [];
    const tileSize = 48 * playerScaleForest;
    
    const startAreaForest = {
        position: {x: gridForest.position.x + tileSize*1, y: gridForest.position.y + tileSize*10},
        width: tileSize * 5,
        height: tileSize * 3
    };
    const finishAreaForest = new InteractableArea({
        position: {x: gridForest.position.x + tileSize*30, y: gridForest.position.y + tileSize*11},
        hitbox: {width: tileSize*5, height: tileSize*3},
        imageSrc: "../assets/images/maps/lobby/house.png",
        scale: .05,
        pressable: false,
        method: () => {
            if(!player.finished){
                player.loaded = false;
                player.finished = true;
                playersFinished++;
                sendFinishedPlayerToServer();
            }
        }
    });
    allInteractableAreasForest.push(finishAreaForest);


    const floorForest = new CollisionBlock({
        position: {x: 0, y: forest.height - 63},
        width: forest.width,
        height: 25
    });
    allCollisionBlocksForest.push(floorForest);

    return [
        forest, staticBackgroundForest, gridForest,
        startAreaForest, allCollisionBlocksForest, allInteractableAreasForest,
        playerScaleForest, scaleForest, tileSize
    ];
};
