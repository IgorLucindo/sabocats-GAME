// Lobby map descriptor
// Describes what the lobby map contains — no system instantiation here.
const LOBBY_MAP_DATA = {
    name: 'lobby',

    background: {
        width: 1280,
        height: 840,
        images: {},
        objects: {
            house: { position: { x: 0, y: 20 }, texture: "assets/textures/maps/lobby/house.png" }
        }
    },

    staticBackground: {
        position: { x: 0, y: 0 },
        texture: "assets/textures/maps/lobby/sky.png"
    },

    grid: null,
    startArea: null,

    // Receives built background; returns collision block descriptors
    collisionBlocks: (bg) => [
        { position: { x: 0, y: 794 }, width: bg.width, height: 30 },
        { position: { x: 200, y: 250 }, width: 580, height: 20 },
        { position: { x: 250, y: 194 }, width: 360, height: 50 },
        { position: { x: 900, y: 250 }, width: 20, height: 500 }
    ],

    // Receives built background; returns interactable area descriptors
    interactableAreas: (bg) => [
        {
            position: { x: 1050, y: 619 }, // floor y(794) - mapBoard height(175)
            hitbox: { width: 140, height: 175 },
            texture: "assets/textures/maps/lobby/mapBoard.png",
            scale: properties.pixelScale,
            pressable: true,
            highlightable: true,
            func: () => { menuSystem.openMapMenu(); }
        }
    ]
};
