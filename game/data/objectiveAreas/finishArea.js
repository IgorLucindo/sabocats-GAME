export default (mapCtx, bg, grid) => ({
    width: mapCtx.properties.tileSize * 2,
    height: mapCtx.properties.tileSize * 3,
    animations: { idle: { texture: "assets/textures/objectiveAreas/flag.png", frameRate: 6, frameBuffer: 13 } },
    onEnter: () => {
        const player = mapCtx.player;
        if (!player.finished) {
            player.finished = true;
            mapCtx.soundSystem.play('finish');
            mapCtx.sendFinishedPlayerToServer();
        }
    }
});
