// EntityFactory - Centralized entity and object creation
// Consolidates all game object instantiation logic in one place

import { Player } from '../entities/characters/Player.js';
import { RemotePlayer } from '../entities/characters/RemotePlayer.js';
import { CharacterOption } from '../entities/characters/CharacterOption.js';
import { PlaceableObject } from '../entities/objects/PlaceableObject.js';
import { PlacedObject } from '../entities/objects/PlacedObject.js';
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

  createCharacterOption({id, position, texture, frameRate, frameBuffer, idNumber, hoverSound}) {
    const characterOption = new CharacterOption({
      id: id,
      position: position,
      texture: texture,
      frameRate: frameRate,
      frameBuffer: frameBuffer,
      idNumber: idNumber,
      hoverSound: hoverSound
    });

    return characterOption;
  }

  createCharacterOptions() {
    return [
      this.createCharacterOption({
        id: "blueCat",
        position: { x: 50, y: 170 },
        texture: "assets/textures/characters/blueCat/sit.png",
        frameRate: 8,
        frameBuffer: 16,
        idNumber: 1,
        hoverSound: 'meow1'
      }),
      this.createCharacterOption({
        id: "blueCat",
        position: { x: 270, y: 170 },
        texture: "assets/textures/characters/blueCat/sit.png",
        frameRate: 8,
        frameBuffer: 16,
        idNumber: 2,
        hoverSound: 'meow2'
      }),
      this.createCharacterOption({
        id: "blueCat",
        position: { x: 530, y: 167 },
        texture: "assets/textures/characters/blueCat/sit.png",
        frameRate: 8,
        frameBuffer: 16,
        idNumber: 3,
        hoverSound: 'meow3'
      })
    ];
  }

  // ===== GAME OBJECT CREATION =====

  createPlaceableObject(id) {
    const objectData = this.data.placeableObjects[id];
    const tileSize = this.gameConfig.rendering.tileSize;

    const placeableObject = new PlaceableObject({
      position: {x: 0, y: 0},
      texture: objectData.animations.default.texture,
      width: objectData.width * tileSize,
      height: objectData.height * tileSize,
      hitbox: {
        position: {
          x: objectData.hitbox.position.x * tileSize,
          y: objectData.hitbox.position.y * tileSize
        },
        width: objectData.hitbox.width * tileSize,
        height: objectData.hitbox.height * tileSize,
        damage: objectData.hitbox.damage
      },
      rotatable: objectData.rotatable,
      needSupport: objectData.needSupport,
      explosion: objectData.explosion,
      compositeObject: objectData.compositeObject,
      objectAttachmentId: objectData.objectAttachmentId,
      animations: objectData.animations,
      type: objectData.type
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
        damage: objectData.hitbox.damage,
        type: objectData.hitbox.type
      },
      movement: objectData.movement,
      idleSound: objectData.idleSound,
      idleSoundCooldown: objectData.idleSoundCooldown
    });

    return attachment;
  }
}
