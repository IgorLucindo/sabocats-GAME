export default (mapCtx, bg) => ({
    hitbox: { width: bg.width, height: 73 * mapCtx.properties.pixelScale },
    cooldown: 0.9,
    onStay: () => {
        const player = mapCtx.player;
        if (player.velocity.x === 0 && player.velocity.y === 0) return;
        mapCtx.particleSystem.add('leavesFalling', {
            x: player.hitbox.position.x + player.hitbox.width / 2 - mapCtx.properties.tileSize / 2,
            y: 73 * mapCtx.properties.pixelScale
        });
        mapCtx.soundSystem.play('leavesRustling');
    },
    onRemoteStay: (remotePlayer) => {
        if (['sit', 'sitting', 'idle'].includes(remotePlayer.currentSprite)) return;
        mapCtx.particleSystem.add('leavesFalling', {
            x: remotePlayer.hitbox.position.x + remotePlayer.hitbox.width / 2 - mapCtx.properties.tileSize / 2,
            y: 73 * mapCtx.properties.pixelScale
        });
        mapCtx.soundSystem.playWorld('leavesRustling', remotePlayer.position);
    }
});
