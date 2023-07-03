function createBoxObject(id){
    switch(id){
        case 0:
            const block1x1 = new BoxObject({
                idNumber: id,
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

        case 1:
            const block1x2 = new BoxObject({
                idNumber: id,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/block1x2.png",
                width: 84,
                height: 42,
                hitbox: {
                    position: {x: 0, y: 0},
                    width: 2*tileSize,
                    height: 1*tileSize
                },
                rotatable: true
            });
            return block1x2;
        
        case 2:
            const spikeBall = new BoxObject({
                idNumber: id,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/spikeBall.png",
                width: 42,
                height: 42,
                hitbox: {
                    position: {x: 4*playerScale, y: 4*playerScale},
                    width: 1*tileSize - 8*playerScale,
                    height: 1*tileSize - 8*playerScale,
                    death: true
                }
            });
            return spikeBall;

        case 3:
            const spikes1x1 = new BoxObject({
                idNumber: id,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/spikes1x1.png",
                width: 42,
                height: 42,
                hitbox: {
                    position: {x: 1, y: tileSize/2},
                    width: 1*tileSize - 2,
                    height: tileSize/2,
                    death: true
                },
                rotatable: true,
                needSupport: true
            });
            return spikes1x1;

        case 4:
            const spikes1x2 = new BoxObject({
                idNumber: id,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/spikes1x2.png",
                width: 84,
                height: 42,
                hitbox: {
                    position: {x: 1, y: tileSize/2},
                    width: 2*tileSize - 2,
                    height: tileSize/2,
                    death: true
                },
                rotatable: true,
                needSupport: true,
                compositeObject: {id: 3, number: 2}
            });
            return spikes1x2;

        case 5:
            const movingSaw = new BoxObject({
                idNumber: id,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/movingSaw.png",
                width: 210,
                height: 42,
                hitbox: {
                    position: {x: 0, y: 0},
                    width: 5*tileSize,
                    height: 1*tileSize
                },
                rotatable: true,
                auxObjectId: "saw"
            });
            return movingSaw;
    };
};