export default (mapCtx, bg) => ({
    hitbox: { width: bg.width, height: 52 * mapCtx.properties.pixelScale },
    onEnter: () => {
        const player = mapCtx.player;
        const pos = {
            x: player.hitbox.position.x + player.hitbox.width / 2,
            y: 73 * mapCtx.properties.pixelScale
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
                    mapCtx.cameraSystem.shake(40, 2);
                }
            });
        }, 1000);
    },
    onRemoteEnter: (remotePlayer) => {
        const pos = {
            x: remotePlayer.hitbox.position.x + remotePlayer.hitbox.width / 2,
            y: 73 * mapCtx.properties.pixelScale
        };
        mapCtx.soundSystem.playWorld('monsterBite', remotePlayer.position);
        setTimeout(() => {
            mapCtx.particleSystem.add('angrySquirrel1', pos, {
                onComplete: () => {
                    mapCtx.particleSystem.add('angrySquirrel2', pos, {
                        onComplete: () => mapCtx.particleSystem.add('angrySquirrel3', pos)
                    });
                    mapCtx.soundSystem.play('monsterRoar');
                    mapCtx.cameraSystem.shake(40, 2);
                }
            });
        }, 1000);
    }
});
