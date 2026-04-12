// Broken Bridge map descriptor
// Describes what the broken bridge map contains — no system instantiation here.
export const BROKEN_BRIDGE_MAP_DATA = {
    name: 'brokenBridge',

    background: {
        width: 680,
        height: 400,
        sky: {
            layer1: { texture: "assets/textures/maps/brokenBridge/skyLayers/1.png" },
            layer2: { texture: "assets/textures/maps/brokenBridge/skyLayers/2.png", parallaxSpeed: 0.1 },
            layer3: { texture: "assets/textures/maps/brokenBridge/skyLayers/3.png", parallaxSpeed: 0.15 },
            layer4: { texture: "assets/textures/maps/brokenBridge/skyLayers/4.png", parallaxSpeed: 0.2 },
        },
        images: {
            layer1:  { texture: "assets/textures/maps/brokenBridge/layers/1.png" },
        },
        objects: {}
    },

    grid: { position: { x: 0, y: -80 } },

    // Receives grid and mapCtx; returns computed spawn area
    spawnArea: (grid, mapCtx) => ({
        position: {
            x: grid.position.x,
            y: grid.position.y + mapCtx.properties.tileSize * 7
        },
        width:  mapCtx.properties.tileSize * 5,
        height: mapCtx.properties.tileSize * 3
    }),

    // Receives built background and mapCtx; returns collision block descriptors
    collisionBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: grid.position.y + mapCtx.properties.tileSize * 10 }, width: mapCtx.properties.tileSize * 6, height: 38 },
        { position: { x: grid.position.x + mapCtx.properties.tileSize * 32, y: grid.position.y + mapCtx.properties.tileSize * 9 }, width: mapCtx.properties.tileSize * 6, height: 38 },
        { position: { x: 0, y: -10 }, width: bg.width, height: 10, isWallSlide: false },
        { position: { x: -10, y: 0 }, width: 10, height: bg.height, isWallSlide: false },
        { position: { x: bg.width, y: 0 }, width: 10, height: bg.height, isWallSlide: false }
    ],

    // Receives built background and mapCtx; returns damage block descriptors
    damageBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: bg.height + 100 }, width: bg.width, height: 10, type: 'fall' }
    ],

    // Receives grid and mapCtx; returns computed finish area
    finishArea: (grid, mapCtx) => ({
        position: {
            x: grid.position.x + mapCtx.properties.tileSize * 35,
            y: grid.position.y + mapCtx.properties.tileSize * 6
        },
        width:  mapCtx.properties.tileSize * 2,
        height: mapCtx.properties.tileSize * 3,
        sprite: { texture: "assets/textures/misc/flag.png", frameRate: 6, frameBuffer: 13, offset: { x: 0, y: 65 } }
    }),

    // Receives built background and mapCtx; returns interactable area descriptors
    interactableAreas: (bg, grid, mapCtx) => {
        return [];
    }
};
