// Side that spikes point at for each rotation (degrees)
const POINTING_SIDE = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' };

export default {
    type: "default",
    animations: {
        default: { texture: "assets/textures/placeableObjects/spikes1x1.png" },
        animated: null,
        idle: { texture: "assets/textures/placeableObjects/spikes1x1Shine.png", frames: 6, frameBuffer: 6, minInterval: 300, maxInterval: 500 }
    },
    width: 1,
    height: 1,
    hitbox: {
        position: { x: 0.05, y: 0.5 },
        width: 0.9,
        height: 0.5,
        damage: "impaled"
    },
    rotatable: true,
    needSupport: true,
    explosion: null,
    compositeObject: { number: 0 },
    objectAttachmentId: null,
    weight: 4,

    // The pose follows where the spikes point, not the side that was touched
    onDamage: (services, object, player) => {
        services.physicsSystem.freezePosition(player);
        services.animationSystem.setImpaledPose(player, POINTING_SIDE[object.rotation]);
    }
};
