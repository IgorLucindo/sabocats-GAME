function createAuxObject(id, mainObject){
    switch(id){
        case "saw":
            const saw = new AuxObject({
                relativePosition: {x: -6, y: -36},
                animations: {
                    default: {imageSrc: "assets/images/auxObjects/stoppedSaw.png", frameRate: 1, frameBuffer: 3},
                    animated: {imageSrc: "assets/images/auxObjects/spinningSaw.png", frameRate: 8, frameBuffer: 6}
                },
                mainObject: mainObject,
                hitbox: {
                    position: {x: 0, y: 0},
                    relativePosition: {x: 0, y: -data.tileSize/2},
                    width: 1*data.tileSize,
                    height: data.tileSize/2,
                    death: true,
                    placingPhaseCollision: false
                },
                movement: (time) => {
                    const movementX = 2*data.tileSize*(1 - Math.cos(time/100));
                    return {x: movementX, y: 0};
                }
            });
            return saw;
    };
};