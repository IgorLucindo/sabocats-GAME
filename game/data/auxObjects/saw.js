// distances in tile size
data.auxObjects["saw"] = {
    relativePosition: {x: -0.15, y: -0.85},
    animations: {
        default: {
            texture: "assets/textures/objects/stoppedSaw.png",
            frameRate: 1,
            frameBuffer: 3
        },
        animated: {
            texture: "assets/textures/objects/spinningSaw.png",
            frameRate: 8,
            frameBuffer: 6
        }
    },
    hitbox: {
        position: {x: 0, y: 0},
        relativePosition: {x: 0, y: -0.5},
        width: 1,
        height: 0.5,
        death: true,
        placingPhaseCollision: false
    },
    movement: (time) => {
        const movementX = 2*(1 - Math.cos(time/100));
        return {x: movementX, y: 0};
    }
};