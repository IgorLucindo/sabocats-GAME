function createAuxObject(objectName){
    switch(objectName){
        case "saw":
            const saw = new AuxObject({
                relativePosition: {x: -6*playerScale, y: -36*playerScale},
                imageSrc: "assets/images/auxObjects/stoppedSaw.png",
                hitbox: {
                    position: {x: 0, y: 0},
                    relativePosition: {x: 0, y: -tileSize/2},
                    width: 1*tileSize,
                    height: tileSize/2,
                    death: true
                },
                movement: (time) => {
                    const movementX = 2*tileSize*(1 - Math.cos(time/100));
                    return {x: movementX, y: 0};
                }
            });
            return saw;
    };
};