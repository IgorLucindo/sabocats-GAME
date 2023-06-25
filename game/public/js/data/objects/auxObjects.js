function createAuxObject(objectName){
    switch(objectName){
        case "saw":
            const saw = new AuxObject({
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/block1x1.png",
                hitbox: {
                    position: {x: 0, y: 0},
                    width: 1*tileSize,
                    height: 1*tileSize,
                    death: true
                },
                getMovement: (time) => {
                    const movementX = 2*tileSize*(1 - Math.cos(time/100));
                    return {x: movementX, y: 0};
                }
            });
            return saw;
    };
};