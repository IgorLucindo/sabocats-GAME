export default {
    type: "explosive",
    animations: {
        default: { texture: "assets/textures/placeableObjects/spikeBall.png" },
        animated: null,
        idle: null
    },
    width: 1,
    height: 1,
    hitbox: {
        position: { x: 0.1, y: 0.1 },
        width: 0.8,
        height: 0.8,
        damage: "impaled"
    },
    rotatable: false,
    needSupport: false,
    explosion: null,
    compositeObject: { number: 0 },
    objectAttachmentId: null,
    weight: 2,

    // The pose follows the side of the ball that was touched
    onDamage: (services, object, player, side) => {
        services.physicsSystem.freezePosition(player);
        services.animationSystem.setImpaledPose(player, side);
    }
};
