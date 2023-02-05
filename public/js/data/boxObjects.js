function createBoxObject(number){
    switch(number){
        case 0:
            const block1x1 = new BoxObject({
                position: {x: 0, y: 0},
                tileWidth: 1,
                tileHeight: 1,
                imageSrc: "../assets/images/objects/block1x1/block1x1.png"
            });
            return block1x1;
    };
};
