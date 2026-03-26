import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';
import { Sprite } from '../entities/Sprite.js';
import { data as gameData } from '../core/DataLoader.js';

// Socket Handler - Centralized network event handling

export class SocketHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.socket = null;
  }

  initialize() {
    this.socket = io();
    this.setupConnectionHandlers();
    this.setupUserHandlers();
    this.setupMatchHandlers();
    this.setupObjectHandlers();
  }

  setupConnectionHandlers() {
    this.socket.on("connect", () => this.onConnect());
    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
    this.socket.on("disconnect", () => {
      console.warn("Socket disconnected");
      // Auto-reload on disconnect (useful when server restarts with nodemon)
      setTimeout(() => { window.location.reload(); }, 500);
    });
  }

  onConnect() {
    const user = gameServices.user;
    const users = gameServices.users;
    user.id = this.socket.id;
    users[this.socket.id] = user;
    user.connected = true;
    this.eventBus.emit('network:connected', { userId: user.id });
  }

  setupUserHandlers() {
    this.socket.on("ON_USER_CONNECT",              (data) => this.onUserConnect(data));
    this.socket.on("ON_USER_DISCONNECT_UPDATE",    (data) => this.onUserDisconnect(data));
    this.socket.on("ON_TICK",                      (data) => this.onTick(data));
    this.socket.on("ON_USER_UPDATE_PLAYER",        (data) => this.onUpdatePlayer(data));
    this.socket.on("ON_USER_CHOOSE_MAP_UPDATE",    (data) => this.onUserChooseMap(data));
  }

  onUserConnect(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    let updatedUsers = JSON.parse(data);

    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];

      if (!users[updatedUser.id]) {
        const newUser = updatedUser;

        newUser.cursor = new Sprite({
          position: { x: 0, y: 0 }, texture: "assets/textures/cursors/red/default.png"
        });
        newUser.cursor.gridPosition = { x: 0, y: 0 };
        newUser.cursor.previousGridPosition = { x: 0, y: 0 };
        newUser.cursor.loaded = true;

        newUser.remotePlayer = gameServices.entityFactory.createRemotePlayer();

        if (updatedUser.onlinePlayer.loaded) {
          newUser.remotePlayer.loadCharacter(
            updatedUser.onlinePlayer.id,
            gameData.characters[updatedUser.onlinePlayer.id],
            updatedUser.onlinePlayer.position,
            updatedUser.onlinePlayer.currentSprite
          );
          let characterOptions = gameState.get('objects.characterOptions');
          characterOptions[updatedUser.characterOption.id - 1].selected = true;
          newUser.cursor.loaded = false;
        }
        users[updatedUser.id] = newUser;
      } else if (users[updatedUser.id].id === user.id) {
        users[updatedUser.id] = updatedUser;
      }
    }

    this.eventBus.emit('network:userConnected', { users: updatedUsers });
  }

  onUserDisconnect(data) {
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    delete users[updatedUser.id];
    this.eventBus.emit('network:userDisconnected', { userId: updatedUser.id });
  }

  onTick(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    let updatedUsers = JSON.parse(data);
    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];
      const userTemp = users[updatedUser.id];

      if (!userTemp || userTemp.id === user.id) { continue; }

      // Update remote player if loaded
      if (userTemp.remotePlayer?.loaded) {
        gsap.to(userTemp.remotePlayer.position, {
          x: updatedUser.onlinePlayer.position.x,
          y: updatedUser.onlinePlayer.position.y,
          duration: 0.015,
          ease: "linear"
        });
        userTemp.remotePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;
      }

      // Update cursor always (even in lobby before players load)
      if (userTemp.cursor) {
        gsap.to(userTemp.cursor.position, {
          x: updatedUser.cursor.position.x,
          y: updatedUser.cursor.position.y,
          duration: 0.015,
          ease: "linear"
        });
      }
    }
    this.eventBus.emit('network:userUpdate', { users: updatedUsers });
  }

  onUpdatePlayer(data) {
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    const { onlinePlayer, characterOption } = updatedUser;

    if (!users[updatedUser.id]) { return; }
    const userTemp = users[updatedUser.id];
    const remotePlayer = userTemp.remotePlayer;

    const characterOptions = gameState.get('objects.characterOptions');

    // If player is loaded (chosen a character)
    if (onlinePlayer.loaded) {
      if (!remotePlayer.loaded) {
        remotePlayer.loadCharacter(
          onlinePlayer.id,
          gameData.characters[onlinePlayer.id]
        );
      }
      if (characterOption.id !== undefined) {
        characterOptions[characterOption.id - 1].selected = true;
      }
      if (userTemp.cursor) { userTemp.cursor.loaded = false; }
    } else {
      // Player is unloaded
      remotePlayer.loaded = false;
      if (!onlinePlayer.finished) {
        // Unload (right-click deselect)
        if (characterOption.id !== undefined) {
          characterOptions[characterOption.id - 1].selected = false;
        }
        if (userTemp.cursor) { userTemp.cursor.loaded = true; }
      }
    }

    // If player is finished
    if (onlinePlayer.finished) {
      remotePlayer.finished = true;
      remotePlayer.dead = onlinePlayer.dead;
    }

    this.eventBus.emit('network:userUpdatePlayer', { user: updatedUser });
  }

  onUserChooseMap(data) {
    let updatedChooseMap = JSON.parse(data);
    gameServices.mapSystem.vote(updatedChooseMap);
    this.eventBus.emit('network:userChooseMap', { chooseMap: updatedChooseMap });
  }

  setupMatchHandlers() {
    this.socket.on("ON_START_MATCH",        () => this.onStartMatch());
    this.socket.on("ON_CHANGE_MATCH_STATE", (data) => this.onChangeMatchState(data));
  }

  onStartMatch() {
    gameServices.startMatch();
    this.eventBus.emit('network:matchStart');
  }

  onChangeMatchState(data) {
    let updatedState = JSON.parse(data);
    gameServices.matchStateMachine.setState(updatedState);
    this.eventBus.emit('network:matchStateChange', { state: updatedState });
  }

  setupObjectHandlers() {
    this.socket.on("ON_GENERATE_PLACEABLEOBJECTS",      (data) => this.onGeneratePlaceableObjects(data));
    this.socket.on("ON_USER_UPDATE_PLACEABLEOBJECT", (data) => this.onUserUpdatePlaceableObject(data));
  }

  onGeneratePlaceableObjects(data) {
    const objectCrate = gameServices.objectCrate;
    let updatedSeed = JSON.parse(data);
    objectCrate.seed = updatedSeed;
    objectCrate.canOpen = true;
    this.eventBus.emit('network:generatePlaceableObjects', { seed: updatedSeed });
  }

  onUserUpdatePlaceableObject(data) {
    const objectCrate = gameServices.objectCrate;
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    if (!users[updatedUser.id]) { return; }

    // Sync full placeableObject state
    const crateIndex = updatedUser.placeableObject.crateIndex;
    users[updatedUser.id].placeableObject = updatedUser.placeableObject;

    // Sync visual object if it exists
    if (crateIndex !== undefined) {
      const object = objectCrate.objects[crateIndex];
      if (object && !object.previousPlaced) {
        object.chose = updatedUser.placeableObject.chose;
        object.placed = updatedUser.placeableObject.placed;
        object.position = updatedUser.placeableObject.position;
        object.rotation = updatedUser.placeableObject.rotation || 0;

        if (updatedUser.placeableObject.placed) {
          object.updateRotationCenter();
          object.updateCompositeObjects();
          object.checkRotation();
          object.checkPlacement();
        }

        if (object.attachment) {
          object.attachment.rotation = updatedUser.placeableObject.rotation || 0;
        }
      }
    }

    if (users[updatedUser.id].cursor) { users[updatedUser.id].cursor.loaded = false; }

    this.eventBus.emit('network:userUpdatePlaceableObject', { user: updatedUser });
  }

  // ===== Send methods =====

  sendTick() {
    const player = gameServices.player;
    const cursorSystem = gameServices.cursorSystem;

    const playerPosition = player.position;
    const playerSprite = player.lastSprite;
    const cursorPosition = cursorSystem.canvasPosition;

    this.socket.emit("ON_TICK", {
      onlinePlayer: { position: playerPosition, currentSprite: playerSprite },
      cursor: { position: cursorPosition }
    });
  }

  sendUpdatePlayer() {
    const player = gameServices.player;
    const user = gameServices.user;
    this.socket.emit("ON_USER_UPDATE_PLAYER", {
      onlinePlayer: {
        id: user.onlinePlayer.id,
        loaded: player.loaded,
        finished: player.finished,
        dead: player.dead
      },
      characterOption: { id: user.characterOption.id }
    });
  }

  sendChooseMap() {
    const user = gameServices.user;
    this.socket.emit("ON_USER_CHOOSE_MAP", user.chooseMap);
  }

  sendJoinMatch() {
    this.socket.emit("ON_USER_JOIN_MATCH");
  }

  sendChangeState(state) {
    this.socket.emit("ON_USER_CHANGE_MATCH_STATE", state);
  }

  sendUpdatePlaceableObject() {
    const user = gameServices.user;
    this.socket.emit("ON_USER_UPDATE_PLACEABLEOBJECT", user.placeableObject);
  }
}
