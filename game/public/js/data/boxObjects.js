function createBoxObject(number){
    switch(number){
        case 0:
            const block1x1 = new BoxObject({
                idNumber: 0,
                position: {x: 0, y: 0},
                width: 1*TILE_SIZE,
                height: 1*TILE_SIZE,
                hitbox: {
                    position: {x: 0, y: 0},
                    width: 1*TILE_SIZE,
                    height: 1*TILE_SIZE
                },
                imageSrc: "../assets/images/objects/block1x1/block1x1.png"
            });
            return block1x1;
        
        case 1:
            const spikeBall = new BoxObject({
                idNumber: 1,
                position: {x: 0, y: 0},
                width: 1*TILE_SIZE,
                height: 1*TILE_SIZE,
                hitbox: {
                    position: {x: 5*player.scale, y: 5*player.scale},
                    width: 1*TILE_SIZE - 10*player.scale,
                    height: 1*TILE_SIZE - 10*player.scale
                },
                deathHitbox: {
                    position: {x: 4*player.scale, y: 4*player.scale},
                    width: 1*TILE_SIZE - 8*player.scale,
                    height: 1*TILE_SIZE - 8*player.scale
                },
                imageSrc: "../assets/images/objects/spikeBall/spikeBall.png"
            });
            return spikeBall;
    };
};