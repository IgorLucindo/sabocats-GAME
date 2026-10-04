export default {
    type: "explosive",
    animations: {
        default: { texture: "assets/textures/placeableObjects/dynamite.png" },
        animated: null,
        idle: { texture: "assets/textures/placeableObjects/dynamiteFuse.png", frames: 8, frameBuffer: 16, minInterval: 0, maxInterval: 0 },
        fail: { texture: "assets/textures/placeableObjects/dynamiteFail.png" }
    },
    width: 1,
    height: 1,
    hitbox: {
        position: { x: 0.1, y: 0.1 },
        width: 0.8,
        height: 0.8,
        damage: false
    },
    rotatable: false,
    needSupport: false,
    explosion: {
        failChance: 0.2,
        failDelay: 220,
        failZoom: 1.2,
        failBox: { width: 5, height: 3 }
    },
    compositeObject: { number: 0 },
    objectAttachmentId: null,
    weight: 4,

    // The match cannot start playing until every placed dynamite has exploded
    onPlace: (services, object) => {
        object.pendingExplosion = true;
        object.failTimer = null;
        services.soundSystem.play('fuse');
    },

    // Fuse finished: a roll seeded per object (so all clients agree) picks a normal explosion
    // or a fail, which focuses the camera on the dynamite and explodes larger after a delay
    onIdleEnd: (services, object) => {
        const { failChance, failDelay, failZoom } = object.explosion;
        if (failChance > 0 && object.syncedRoll(10000) < failChance) {
            object.stopIdle();
            object.switchSprite('fail');
            services.soundSystem.play('fail');
            services.cameraSystem.focusOn({
                position: object.position,
                width: object.width,
                height: object.height,
                zoom: failZoom
            });
            object.failTimer = failDelay;
        } else {
            explode(services, object);
        }
    },

    onUpdate: (services, object) => {
        if (object.failTimer === null) { return; }
        if (--object.failTimer <= 0) {
            object.failTimer = null;
            explodeFail(services, object);
        }
    }
};

// Destroy everything overlapping the dynamite, then the dynamite itself
function explode(services, object) {
    object.destroyObjectsInRect({
        position: {
            x: object.position.x + object.hitbox.position.x,
            y: object.position.y + object.hitbox.position.y
        },
        width: object.hitbox.width,
        height: object.hitbox.height
    });

    services.particleSystem.add("explosion", object.position);
    services.soundSystem.play("explosion");
    services.cameraSystem.shake(25, 2);
    object.destroy();
    services.matchStateMachine.flushPendingState();
}

// Fail explosion: larger area, stronger shake, restores the camera
function explodeFail(services, object) {
    const ts = services.gameConfig.rendering.tileSize;
    const { width: fW, height: fH } = object.explosion.failBox;
    const cx = object.position.x + object.hitbox.position.x + object.hitbox.width / 2;
    const cy = object.position.y + object.hitbox.position.y + object.hitbox.height / 2;
    object.destroyObjectsInRect({
        position: { x: cx - (fW * ts) / 2 + 1, y: cy - (fH * ts) / 2 + 1 },
        width: fW * ts - 2,
        height: fH * ts - 2
    });

    services.particleSystem.add("explosion_large", object.position);
    services.soundSystem.play("explosion_large");
    services.cameraSystem.shake(35, 3);
    services.cameraSystem.clearFollowTarget();
    services.cameraSystem.setZoom(services.gameConfig.camera.maxZoom);
    object.destroy();
    services.matchStateMachine.flushPendingState();
}
