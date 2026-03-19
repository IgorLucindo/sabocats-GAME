// EntityFactory - Centralized entity and object creation
// Consolidates all game object instantiation logic in one place

class EntityFactory {
  constructor(dependencies) {
    this.gameConfig = dependencies.gameConfig;
  }

  // ===== PLAYER CREATION =====

  createPlayer({id, position, selectablePlayer = null}) {
    const player = new Player({
      position: position,
      animations: data.characters[id],
      selectablePlayer: selectablePlayer
    });

    return player;
  }

  createOnlinePlayer({id, position = {x: 0, y: 0}, currentSprite = "idleSit"}) {
    const onlinePlayer = new OnlinePlayer({
      position: position,
      animations: data.characters[id],
      currentSprite: currentSprite
    });

    return onlinePlayer;
  }

  // ===== GAME OBJECT CREATION =====

  createBoxObject(idNumber) {
    const objectData = data.objects[idNumber];
    const tileSize = this.gameConfig.rendering.tileSize;

    const boxObject = new BoxObject({
      idNumber: idNumber,
      position: {x: 0, y: 0},
      texture: objectData.texture,
      width: objectData.width * tileSize,
      height: objectData.height * tileSize,
      hitbox: {
        position: {
          x: objectData.hitbox.position.x * tileSize,
          y: objectData.hitbox.position.y * tileSize
        },
        width: objectData.hitbox.width * tileSize,
        height: objectData.hitbox.height * tileSize,
        death: objectData.hitbox.death
      },
      rotatable: objectData.rotatable,
      needSupport: objectData.needSupport,
      compositeObject: objectData.compositeObject,
      auxObjectId: objectData.auxObjectId
    });

    return boxObject;
  }

  createAuxObject(id, mainObject) {
    const objectData = data.auxObjects[id];
    const tileSize = this.gameConfig.rendering.tileSize;

    const auxObject = new AuxObject({
      relativePosition: {
        x: objectData.relativePosition.x * tileSize,
        y: objectData.relativePosition.y * tileSize
      },
      animations: objectData.animations,
      mainObject: mainObject,
      hitbox: {
        position: {
          x: objectData.hitbox.position.x * tileSize,
          y: objectData.hitbox.position.y * tileSize
        },
        relativePosition: {
          x: objectData.hitbox.relativePosition.x * tileSize,
          y: objectData.hitbox.relativePosition.y * tileSize
        },
        width: objectData.hitbox.width * tileSize,
        height: objectData.hitbox.height * tileSize,
        death: true,
        placingPhaseCollision: false
      },
      movement: objectData.movement
    });

    return auxObject;
  }

  // ===== PARTICLE CREATION =====

  createParticle(key) {
    const particle = new Particle({ ...data.particles[key] });
    return particle;
  }
}

// Create singleton instance
const entityFactory = new EntityFactory({ gameConfig: GameConfig });
