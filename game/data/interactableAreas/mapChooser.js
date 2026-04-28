export default (mapCtx, bg) => ({
    hitbox: { width: 24 * mapCtx.properties.pixelScale, height: 24 * mapCtx.properties.pixelScale },
    animations: {
        idle: { texture: "assets/textures/interactableAreas/deskGlobe.png" },
        spin: { texture: "assets/textures/interactableAreas/deskGlobeSpin.png", frames: 5, frameBuffer: 5, loops: 7 },
        choose: { texture: "assets/textures/interactableAreas/deskGlobeChoose.png" }
    },
    onPress: () => { mapCtx.menuSystem.openMapMenu(); },
    onExit: () => { mapCtx.menuSystem.closeMapMenu(); }
});
