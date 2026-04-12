// Forest map descriptor
// Describes what the forest map contains — no system instantiation here.
export const FOREST_MAP_DATA = {
    name: 'forest',

    background: {
        width: 928,
        height: 400,
        sky: null,
        images: {
            layer1:  { texture: "assets/textures/maps/forest/layers/1.png", parallaxSpeed: 0.5 },
            layer2:  { texture: "assets/textures/maps/forest/layers/2.png", parallaxSpeed: 0.5 },
            layer3:  { texture: "assets/textures/maps/forest/layers/3.png", parallaxSpeed: 0.3 },
            layer4:  { texture: "assets/textures/maps/forest/layers/4.png", parallaxSpeed: 0.3 },
            layer5:  { texture: "assets/textures/maps/forest/layers/5.png", parallaxSpeed: 0.2 },
            layer6:  { texture: "assets/textures/maps/forest/layers/6.png", parallaxSpeed: 0.2 },
            layer7:  { texture: "assets/textures/maps/forest/layers/7.png" },
            layer8:  { texture: "assets/textures/maps/forest/layers/8.png", front: true },
            layer9:  { texture: "assets/textures/maps/forest/layers/9.png", front: true },
            layer10: { texture: "assets/textures/maps/forest/layers/10.png", front: true }
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
        { position: { x: 0, y: grid.position.y + mapCtx.properties.tileSize * 19 }, width: bg.width, height: bg.height - (grid.position.y + mapCtx.properties.tileSize * 19), isWallSlide: false },
        { position: { x: 0, y: 0 }, width: bg.width, height: 120, isWallSlide: false },
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
            x: grid.position.x + mapCtx.properties.tileSize * 38,
            y: grid.position.y + mapCtx.properties.tileSize * 16
        },
        width:  mapCtx.properties.tileSize * 2,
        height: mapCtx.properties.tileSize * 3,
        sprite: { texture: "assets/textures/misc/flag.png", frameRate: 6, frameBuffer: 13, offset: { x: 0, y: 65 } }
    }),

    // Receives built background and mapCtx; returns interactable area descriptors
    interactableAreas: (bg, grid, mapCtx) => {
        const leavesHitbox  = { width: bg.width, height: 205 };
        return [
            {
                position: { x: 0, y: 0 },
                hitbox: leavesHitbox,
                cooldown: 0.9,
                onStay: () => {
                    const player = mapCtx.player;
                    if (player.velocity.x === 0 && player.velocity.y === 0) return;
                    mapCtx.particleSystem.add('leavesFalling', {
                        x: player.hitbox.position.x + player.hitbox.width / 2 - mapCtx.properties.tileSize / 2,
                        y: leavesHitbox.height
                    });
                    mapCtx.soundSystem.play('leavesRustling');
                },
                onRemoteStay: (remotePlayer) => {
                    if (['sit', 'sitting', 'idle'].includes(remotePlayer.currentSprite)) return;
                    mapCtx.particleSystem.add('leavesFalling', {
                        x: remotePlayer.hitbox.position.x + remotePlayer.hitbox.width / 2 - mapCtx.properties.tileSize / 2,
                        y: leavesHitbox.height
                    });
                    mapCtx.soundSystem.playWorld('leavesRustling', remotePlayer.position);
                }
            },
            {
                position: { x: 0, y: 0 },
                hitbox: { width: bg.width, height: 140 },
                onEnter: () => {
                    const player = mapCtx.player;
                    const pos = {
                        x: player.hitbox.position.x + player.hitbox.width / 2,
                        y: leavesHitbox.height
                    };
                    player.die('decapitated');
                    mapCtx.soundSystem.play('monsterBite');
                    setTimeout(() => {
                        mapCtx.particleSystem.add('angrySquirrel1', pos, {
                            onComplete: () => {
                                mapCtx.particleSystem.add('angrySquirrel2', pos, {
                                    onComplete: () => mapCtx.particleSystem.add('angrySquirrel3', pos)
                                });
                                mapCtx.soundSystem.play('monsterRoar');
                                mapCtx.cameraSystem.shake(40, 5);
                            }
                        });
                    }, 1000);
                },
                onRemoteEnter: (remotePlayer) => {
                    const pos = {
                        x: remotePlayer.hitbox.position.x + remotePlayer.hitbox.width / 2,
                        y: leavesHitbox.height
                    };
                    mapCtx.soundSystem.playWorld('monsterBite', remotePlayer.position);
                    setTimeout(() => {
                        mapCtx.particleSystem.add('angrySquirrel1', pos, {
                            onComplete: () => {
                                mapCtx.particleSystem.add('angrySquirrel2', pos, {
                                    onComplete: () => mapCtx.particleSystem.add('angrySquirrel3', pos)
                                });
                                mapCtx.soundSystem.play('monsterRoar');
                                mapCtx.cameraSystem.shake(40, 5);
                            }
                        });
                    }, 1000);
                }
            }
        ];
    }
};
