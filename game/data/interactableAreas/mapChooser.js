export default (mapCtx, bg) => ({
    hitbox: { width: 28 * mapCtx.properties.pixelScale, height: 31 * mapCtx.properties.pixelScale },
    animations: { idle: { texture: "assets/textures/interactableAreas/deskGlobe.png" } },
    onPress: () => { mapCtx.menuSystem.openMapMenu(); },
    onExit: () => { mapCtx.menuSystem.closeMapMenu(); }
});
