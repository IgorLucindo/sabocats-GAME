export default (mapCtx, bg, grid) => ({
    hitbox: { width: 85, height: 105 },
    animations: { idle: { texture: "assets/textures/maps/lobby/mapBoard.png" } },
    onPress: () => { mapCtx.menuSystem.openMapMenu(); },
    onExit: () => { mapCtx.menuSystem.closeMapMenu(); }
});
