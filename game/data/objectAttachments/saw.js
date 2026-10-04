export default {
    relativePosition: { x: -0.1, y: -0.78 },
    movement: (time) => ({ x: 2 * (1 - Math.cos(time / 100)), y: 0 }),
    animations: {
        default:  { texture: "assets/textures/objectAttachments/saw.png" },
        animated: { texture: "assets/textures/objectAttachments/animated/saw.png", frames: 6, frameBuffer: 8 }
    },
    hitbox: {
        position: { x: 0, y: 0 },
        relativePosition: { x: 0, y: -0.5 },
        width: 1,
        height: 0.5,
        damage: "slicedSaw"
    },
    idleSound: "saw",
    idleSoundCooldown: 16000
};
