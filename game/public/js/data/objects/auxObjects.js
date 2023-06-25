function createAuxObject(objectName){
    switch(objectName){
        case "saw":
            const block1x1 = new BoxObject({
                idNumber: 0,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/block1x1.png",
                width: 42,
                height: 42,
                hitbox: {
                    position: {x: 0, y: 0},
                    width: 1*tileSize,
                    height: 1*tileSize
                }
            });
            return block1x1;
    };
};