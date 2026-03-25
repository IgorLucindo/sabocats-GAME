// EntityFactory - Centralized entity and object creation
// Consolidates all game object instantiation logic in one place

import { Player } from '../entities/characters/Player.js';
import { RemotePlayer } from '../entities/characters/RemotePlayer.js';
import { CharacterOption } from '../entities/characters/CharacterOption.js';
import { PlaceableObject } from '../entities/objects/PlaceableObject.js';
import { ObjectAttachment } from '../entities/objects/ObjectAttachment.js';

export class EntityFactory {
  constructor(dependencies) {
    this.gameConfig = dependencies.gameConfig;
    this.data = dependencies.data;
  }

  // ===== PLAYER CREATION =====

  createPlayer() {
    return new Player();
  }

  createRemotePlayer() {
    return new RemotePlayer();
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
    const objectData = this.data.placeableObjects[idNumber];
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
    const objectData = this.data.objectAttachments[id];
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
