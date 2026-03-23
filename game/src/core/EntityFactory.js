// EntityFactory - Centralized entity and object creation
// Consolidates all game object instantiation logic in one place

class EntityFactory {
  constructor(dependencies) {
    this.gameConfig = dependencies.gameConfig;
  }

  // ===== PLAYER CREATION =====

  createPlayer({id, position, characterOption = null}) {
    const player = new Player({
      position: position,
      animations: data.characters[id],
      characterOption: characterOption
    });

    return player;
  }

  createRemotePlayer({id, position = {x: 0, y: 0}, currentSprite = "idleSit"}) {
    const remotePlayer = new RemotePlayer({
      position: position,
      animations: data.characters[id],
      currentSprite: currentSprite
    });

    return remotePlayer;
  }

  createCharacterOption({id, position, texture, frameRate, frameBuffer, idNumber}) {
    const characterOption = new CharacterOption({
      id: id,
      position: position,
      texture: texture,
      frameRate: frameRate,
      frameBuffer: frameBuffer,
      idNumber: idNumber
    });

    return characterOption;
  }

  createCharacterOptions() {
    return [
      this.createCharacterOption({
        id: "blackCat",
        position: { x: 390, y: 125 },
        texture: "assets/textures/characters/blackCat/idleSit.png",
        frameRate: 18,
        frameBuffer: 9,
        idNumber: 1
      }),
      this.createCharacterOption({
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

  createPlaceableObject(idNumber) {
    const objectData = data.placeableObjects[idNumber];
    const tileSize = this.gameConfig.rendering.tileSize;

    const placeableObject = new PlaceableObject({
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
      objectAttachmentId: objectData.objectAttachmentId
    });

    return placeableObject;
  }

  createObjectAttachment(id, mainObject) {
    const objectData = data.objectAttachments[id];
    const tileSize = this.gameConfig.rendering.tileSize;

    const attachment = new ObjectAttachment({
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

    return attachment;
  }
}

// Create singleton instance
const entityFactory = new EntityFactory({ gameConfig: GameConfig });
