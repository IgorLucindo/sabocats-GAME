export default (mapCtx, bg, grid) => ({
    hitbox: { width: bg.width, height: 140 },
    onEnter: () => {
        const player = mapCtx.player;
        const pos = {
            x: player.hitbox.position.x + player.hitbox.width / 2,
            y: 205
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
            y: 205
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
});
