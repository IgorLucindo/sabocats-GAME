function createBoxObject(number){
    switch(number){
        case 0:
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

        case 1:
            const block1x2 = new BoxObject({
                idNumber: 1,
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
                idNumber: 2,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/spikeBall.png",
                width: 42,
                height: 42,
                hitbox: {
                    position: {x: 4*player.scale, y: 4*player.scale},
                    width: 1*tileSize - 8*player.scale,
                    height: 1*tileSize - 8*player.scale
                },
                death: true
            });
            return spikeBall;

        case 3:
            const spikes1x1 = new BoxObject({
                idNumber: 3,
                position: {x: 0, y: 0},
                imageSrc: "assets/images/objects/spikes1x1.png",
                width: 42,
                height: 42,
                hitbox: {
                    position: {x: 0, y: tileSize/2},
                    width: 1*tileSize,
                    height: tileSize/2
                },
                rotatable: true,
                death: true
            });
            return spikes1x1;
    };
};