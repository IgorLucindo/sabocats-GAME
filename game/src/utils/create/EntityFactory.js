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

  createSelectablePlayer({id, position, texture, frameRate, frameBuffer, idNumber}) {
    const selectablePlayer = new SelectablePlayer({
      id: id,
      position: position,
      texture: texture,
      frameRate: frameRate,
      frameBuffer: frameBuffer,
      idNumber: idNumber
    });

    return selectablePlayer;
  }

  createSelectablePlayers() {
    return [
      this.createSelectablePlayer({
        id: "blackCat",
        position: { x: 390, y: 125 },
        texture: "assets/textures/characters/blackCat/idleSit.png",
        frameRate: 18,
        frameBuffer: 9,
        idNumber: 1
      }),
      this.createSelectablePlayer({
        id: "blackCat",
        position: { x: 570, y: 182 },
        texture: "assets/textures/characters/blackCat/idleSitLeft.png",
        frameRate: 18,
        frameBuffer: 9,
        idNumber: 2
      })
    ];
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
