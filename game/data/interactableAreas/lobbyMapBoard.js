export default (mapCtx, bg) => ({
    hitbox: { width: 28 * mapCtx.properties.pixelScale, height: 35 * mapCtx.properties.pixelScale },
    animations: { idle: { texture: "assets/textures/maps/lobby/mapBoard.png" } },
    onPress: () => { mapCtx.menuSystem.openMapMenu(); },
    onExit: () => { mapCtx.menuSystem.closeMapMenu(); }
});
