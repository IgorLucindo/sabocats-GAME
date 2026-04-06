// Forest map descriptor
// Describes what the forest map contains — no system instantiation here.
export const FOREST_MAP_DATA = {
    name: 'forest',

    background: {
        width: 928,
        height: 400,
        sky: null,
        images: {
            image1:  { texture: "assets/textures/maps/forest/background/1.png", parallaxSpeed: 0.5 },
            image2:  { texture: "assets/textures/maps/forest/background/2.png", parallaxSpeed: 0.5 },
            image3:  { texture: "assets/textures/maps/forest/background/3.png", parallaxSpeed: 0.3 },
            image4:  { texture: "assets/textures/maps/forest/background/4.png", parallaxSpeed: 0.3 },
            image5:  { texture: "assets/textures/maps/forest/background/5.png", parallaxSpeed: 0.2 },
            image6:  { texture: "assets/textures/maps/forest/background/6.png", parallaxSpeed: 0.2 },
            image7:  { texture: "assets/textures/maps/forest/background/7.png" },
            image8:  { texture: "assets/textures/maps/forest/background/8.png", front: true },
            image9:  { texture: "assets/textures/maps/forest/background/9.png", front: true },
            image10: { texture: "assets/textures/maps/forest/background/10.png", front: true }
        },
        objects: {}
    },

    grid: { position: { x: 0, y: -20 } },

    // Receives grid and mapCtx; returns computed spawn area
    spawnArea: (grid, mapCtx) => ({
        position: {
            x: grid.position.x + mapCtx.properties.tileSize,
            y: grid.position.y + mapCtx.properties.tileSize * 16
        },
        width:  mapCtx.properties.tileSize * 5,
        height: mapCtx.properties.tileSize * 3
    }),

    // Receives built background and mapCtx; returns collision block descriptors
    collisionBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: grid.position.y + mapCtx.properties.tileSize * 19 }, width: bg.width, height: mapCtx.properties.tileSize },
        { position: { x: -10, y: 0 }, width: 10, height: bg.height, isWallSlide: false },
        { position: { x: bg.width, y: 0 }, width: 10, height: bg.height, isWallSlide: false },
    ],

    // Receives built background and mapCtx; returns damage block descriptors
    damageBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: bg.height }, width: bg.width, height: mapCtx.properties.tileSize }
    ],

    // Receives built background, grid, and mapCtx; returns interactable area descriptors
    interactableAreas: (bg, grid, mapCtx) => [
        {
            finish: true,
            position: {
                x: grid.position.x + mapCtx.properties.tileSize * 38,
                y: grid.position.y + mapCtx.properties.tileSize * 16
            },
            hitbox: { width: mapCtx.properties.tileSize * 2, height: mapCtx.properties.tileSize * 3 },
            sprite: { texture: "assets/textures/crops/flag.png", frameRate: 6, frameBuffer: 13, offset: { x: 0, y: 65 } },
            blockedDuringPlacing: true,
            func: () => {
                const player = mapCtx.player;
                if (!player.finished) {
                    player.finished = true;
                    mapCtx.sendFinishedPlayerToServer();
                }
            }
        }
    ]
};
