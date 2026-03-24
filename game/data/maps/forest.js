// Forest map descriptor
// Describes what the forest map contains — no system instantiation here.
export const FOREST_MAP_DATA = {
    name: 'forest',

    background: {
        width: 928,
        height: 400,
        scale: 2,
        images: {
            image1:  { texture: "assets/textures/maps/forest/forest1.png",   parallaxSpeed: 0.5 },
            image2:  { texture: "assets/textures/maps/forest/forest2.png",   parallaxSpeed: 0.5 },
            image3:  { texture: "assets/textures/maps/forest/forest3.png",   parallaxSpeed: 0.3 },
            image4:  { texture: "assets/textures/maps/forest/forest4.png",   parallaxSpeed: 0.3 },
            image5:  { texture: "assets/textures/maps/forest/forest5.png",   parallaxSpeed: 0.2 },
            image6:  { texture: "assets/textures/maps/forest/forest6.png",   parallaxSpeed: 0.2 },
            image7:  { texture: "assets/textures/maps/forest/forest7.png" },
            grid:    { texture: "assets/textures/maps/forest/gridForest.png", grid: true },
            image8:  { texture: "assets/textures/maps/forest/forest8.png",   front: true },
            image9:  { texture: "assets/textures/maps/forest/forest9.png",   front: true },
            image10: { texture: "assets/textures/maps/forest/forest10.png",  front: true }
        },
        objects: {}
    },

    staticBackground: null,

    grid: { position: { x: 2, y: 0 } },

    // Receives grid and mapCtx; returns computed start area
    startArea: (grid, mapCtx) => ({
        position: {
            x: grid.position.x + mapCtx.properties.tileSize,
            y: grid.position.y + mapCtx.properties.tileSize * 11
        },
        width:  mapCtx.properties.tileSize * 5,
        height: mapCtx.properties.tileSize * 3
    }),

    // Receives built background and mapCtx; returns collision block descriptors
    collisionBlocks: (bg, mapCtx) => [
        { position: { x: 0, y: bg.height - 128 }, width: bg.width, height: mapCtx.properties.tileSize }
    ],

    // Receives built background, grid, and mapCtx; returns interactable area descriptors
    interactableAreas: (bg, grid, mapCtx) => [
        {
            position: {
                x: grid.position.x + mapCtx.properties.tileSize * 22,
                y: grid.position.y + mapCtx.properties.tileSize * 11
            },
            hitbox: { width: mapCtx.properties.tileSize * 5, height: mapCtx.properties.tileSize * 3 },
            texture: "assets/textures/maps/lobby/house.png",
            scale: 0.05,
            func: () => {
                const player = mapCtx.player;
                if (!player.finished) {
                    player.loaded = false;
                    player.finished = true;
                    mapCtx.sendFinishedPlayerToServer();
                }
            }
        }
    ]
};
