export default (mapCtx, bg) => ({
    width: mapCtx.properties.tileSize * 5,
    height: mapCtx.properties.tileSize * 3,
    onEnter: () => { mapCtx.player.invulnerable = true; },
    onExit: () => { mapCtx.player.invulnerable = false; }
});
