// MapFactory - Centralized map/environment creation
// Consolidates all map instantiation logic in one place

class MapFactory {
  constructor(dependencies) {
    this.gameConfig = dependencies.gameConfig;
  }

  // Create a map by name
  createMap(mapName) {
    switch(mapName) {
      case 'lobby':
        return this.createLobby();
      case 'forest':
        return this.createForest();
      default:
        throw new Error(`Unknown map: ${mapName}`);
    }
  }

  // ===== MAP CREATION =====

  createLobby() {
    const [background, staticBackground, grid, allCollisionBlocks, allInteractableAreas] = createLobby();

    return {
      background,
      staticBackground,
      grid,
      startArea: null,
      allCollisionBlocks,
      allInteractableAreas
    };
  }

  createForest() {
    const [background, staticBackground, grid, startArea, allCollisionBlocks, allInteractableAreas] = createForest();

    return {
      background,
      staticBackground,
      grid,
      startArea,
      allCollisionBlocks,
      allInteractableAreas
    };
  }
}

// Create singleton instance
const mapFactory = new MapFactory({ gameConfig: GameConfig });
