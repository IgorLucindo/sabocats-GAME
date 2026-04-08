// Lobby map descriptor
// Describes what the lobby map contains — no system instantiation here.
export const LOBBY_MAP_DATA = {
    name: 'lobby',

    background: {
        width: 512,
        height: 250,
        sky: { position: { x: 0, y: 0 }, texture: "assets/textures/maps/lobby/background/sky.png" },
        images: {
            image1: { position: { x: 0, y: 0 }, texture: "assets/textures/maps/lobby/background/1.png", parallaxSpeed: 0 }
        },
        objects: {}
    },

    grid: null,
    spawnArea: null,

    // Receives built background and mapCtx; returns collision block descriptors
    collisionBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: bg.height - 135 }, width: bg.width, height: 10 },
        { position: { x: 38, y: 267 }, width: 146, height: 10 },
        { position: { x: 255, y: 267 }, width: 146, height: 10 },
        { position: { x: 518, y: 263 }, width: 140, height: 10 },
        { position: { x: 1275, y: 0 }, width: 10, height: 610 },
        { position: { x: -10, y: 0 }, width: 10, height: bg.height, isWallSlide: false },
        { position: { x: bg.width, y: 0 }, width: 10, height: bg.height, isWallSlide: false },
    ],

    // Receives built background and mapCtx; returns damage block descriptors
    damageBlocks: (bg, grid, mapCtx) => [
        { position: { x: 0, y: bg.height }, width: bg.width, height: 10 }
    ],

    // Receives built background and mapCtx; returns interactable area descriptors
    interactableAreas: (bg, grid, mapCtx) => [
        {
            position: { x: 1150, y: bg.height - 240 },
            hitbox: { width: 85, height: 105 },
            sprite: {
                texture: "assets/textures/maps/lobby/mapBoard.png",
                scale: mapCtx.properties.pixelScale,
            },
            pressable: true,
            highlightable: true,
            func: () => { mapCtx.menuSystem.openMapMenu(); },
            onLeave: () => { mapCtx.menuSystem.closeMapMenu(); }
        }
    ]
};
