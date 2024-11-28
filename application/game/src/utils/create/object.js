// create box object
function createBoxObject(idNumber){
    const objectData = data.objects[idNumber];

    const tileSize = properties.tileSize;

    const boxObject = new BoxObject({
        idNumber: idNumber,
        position: {x: 0, y: 0},
        texture: objectData.texture,
        width: objectData.width * tileSize,
        height: objectData.height * tileSize,
        hitbox: {
            position: {
                x: objectData.hitbox.position.x * tileSize,
                y: objectData.hitbox.position.y * tileSize
            },
            width: objectData.hitbox.width * tileSize,
            height: objectData.hitbox.height * tileSize,
            death: objectData.hitbox.death
        },
        rotatable: objectData.rotatable,
        needSupport: objectData.needSupport,
        compositeObject: objectData.compositeObject,
        auxObjectId: objectData.auxObjectId
    });

    return boxObject;
};



// create auxiliary object
function createAuxObject(id, mainObject){
    const objectData = data.auxObjects[id];

    const tileSize = properties.tileSize;

    const auxObject = new AuxObject({
        relativePosition: {
            x: objectData.relativePosition.x * tileSize,
            y: objectData.relativePosition.y * tileSize
        },
        animations: objectData.animations,
        mainObject: mainObject,
        hitbox: {
            position: {
                x: objectData.hitbox.position.x * tileSize,
                y: objectData.hitbox.position.y * tileSize
            },
            relativePosition: {
                x: objectData.hitbox.relativePosition.x * tileSize,
                y: objectData.hitbox.relativePosition.y * tileSize
            },
            width: objectData.hitbox.width * tileSize,
            height: objectData.hitbox.height * tileSize,
            death: true,
            placingPhaseCollision: false
        },
        movement: objectData.movement
    });

    return auxObject;
};