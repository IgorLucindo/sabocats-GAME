import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';
import { data as gameData } from '../core/DataLoader.js';
import { Sprite } from '../entities/Sprite.js';
import { getCursorColor } from '../helpers.js';

// Socket Handler - Centralized network event handling

export class SocketHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.socket = null;
    this.ping = 0;
  }

  initialize() {
    this.socket = io();
    this.setupConnectionHandlers();
    this.setupRoomHandlers();
    this.setupUserHandlers();
    this.setupMatchHandlers();
    this.setupObjectHandlers();
  }

  setupConnectionHandlers() {
    this.socket.on("connect", () => this.onConnect());
    this.socket.on("ON_PONG", (timestamp) => {
      this.ping = Math.round(performance.now() - timestamp);
    });
    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
    this.socket.on("disconnect", () => {
      console.warn("Socket disconnected");
      // Auto-reload on disconnect (useful when server restarts with nodemon)
      setTimeout(() => { window.location.reload(); }, 500);
    });
    setInterval(() => {
      if (this.socket?.connected) { this.socket.emit("ON_PING", performance.now()); }
    }, 2000);
  }

  onConnect() {
    const user = gameServices.user;
    const users = gameServices.users;
    user.id = this.socket.id;
    users[this.socket.id] = user;
    user.connected = true;
    this.eventBus.emit('network:connected', { userId: user.id });

    // Auto-join dev room if configured, otherwise create a new room
    const { joinDevRoom, devRoomId } = gameServices.gameConfig.debug;
    if (joinDevRoom) {
      this.sendJoinRoom(devRoomId);
    } else {
      this.sendCreateRoom();
    }
  }

  // ===== Rooms =====

  setupRoomHandlers() {
    this.socket.on("ROOM_CREATED",   (data) => this.onRoomCreated(data));
    this.socket.on("ROOM_JOINED",    (data) => this.onRoomJoined(data));
    this.socket.on("ROOM_NOT_FOUND", ()     => this.onRoomError("Room not found"));
    this.socket.on("ROOM_FULL",      ()     => this.onRoomError("Room is full"));
    this.socket.on("ON_KICKED",      ()     => this.onKicked());
    this.socket.on("ON_HOST_CHANGED",(data) => this.onHostChanged(data));
  }

  onRoomCreated(data) {
    const { roomId, hostId, matchSettings } = JSON.parse(data);
    gameState.set('room.id', roomId);
    gameState.set('room.hostId', hostId);
    gameState.set('room.matchSettings', matchSettings);

    gameServices.menuSystem.showPartyPanel();
    gameServices.menuSystem.updatePartyPanel();

    this.eventBus.emit('network:roomCreated', { roomId, hostId });
  }

  onRoomJoined(data) {
    const { roomId, hostId, matchSettings } = JSON.parse(data);
    gameState.set('room.id', roomId);
    gameState.set('room.hostId', hostId);
    gameState.set('room.matchSettings', matchSettings);

    // Clear old room's remote users before ON_USER_CONNECT repopulates
    this._clearRemoteUsers();

    // Unload local player if they had a character selected in the previous room
    const player = gameServices.player;
    if (player.loaded) { player.reselectPlayer(); }

    gameServices.menuSystem.showPartyPanel();

    this.eventBus.emit('network:roomJoined', { roomId, hostId });
  }

  onRoomError(message) {
    // If a devRoom auto-join failed, create the room using the devRoomId
    if (gameServices.gameConfig.debug.joinDevRoom) {
      this.sendCreateRoom(gameServices.gameConfig.debug.devRoomId);
    } else {
      gameServices.menuSystem.showRoomError(message);
    }
  }

  onKicked() {
    window.location.reload();
  }

  onHostChanged(data) {
    const { hostId } = JSON.parse(data);
    gameState.set('room.hostId', hostId);
    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:hostChanged', { hostId });
  }

  // ===== Users =====

  setupUserHandlers() {
    this.socket.on("ON_USER_CONNECT",              (data) => this.onUserConnect(data));
    this.socket.on("ON_USER_DISCONNECT_UPDATE",    (data) => this.onUserDisconnect(data));
    this.socket.on("ON_TICK",                      (data) => this.onTick(data));
    this.socket.on("ON_USER_UPDATE_PLAYER",        (data) => this.onUpdatePlayer(data));
    this.socket.on("ON_USER_UPDATE_NAME",          (data) => this.onUpdateName(data));
    this.socket.on("ON_USER_CHOOSE_MAP_UPDATE",    (data) => this.onUserChooseMap(data));
    this.socket.on("ON_CHAT_MESSAGE",              (data) => this.onChatMessage(data));
    this.socket.on("ON_PARTICLE",                  (data) => this.onParticle(data));
    this.socket.on("ON_SOUND",                     (data) => this.onSound(data));
  }

  onUserConnect(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    let updatedUsers = JSON.parse(data);

    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];
      const isLocalUser = updatedUser.id === user.id;

      if (isLocalUser) {
        const savedName = user.name; // preserve localStorage name before server overwrites it
        // Sync local user data in-place — keeps users[user.id] pointing to the same object
        Object.assign(user, updatedUser);
        user.name = savedName;
        // loginOrder is now set — apply the correct cursor color
        gameServices.cursorSystem.showCursor();
        this.sendUpdateName(savedName);
      } else if (!users[updatedUser.id]) {
        const newUser = updatedUser;
        const cursorColor = getCursorColor(updatedUser.loginOrder);

        newUser.cursor = new Sprite({
          position: { x: 0, y: 0 },
          texture: `assets/textures/cursors/${cursorColor}/default.png`,
          scale: 1
        });
        newUser.cursor.gridPosition = { x: 0, y: 0 };
        newUser.cursor.previousGridPosition = { x: 0, y: 0 };
        newUser.cursor.loaded = true;

        newUser.remotePlayer = gameServices.entityFactory.createRemotePlayer();

        if (updatedUser.localPlayer.loaded) {
          newUser.remotePlayer.loadCharacter(
            updatedUser.localPlayer.id,
            gameData.characters[updatedUser.localPlayer.id],
            updatedUser.localPlayer.position,
            updatedUser.localPlayer.currentSprite
          );
          let characterOptions = gameState.get('characterOptions');
          characterOptions[updatedUser.characterOption.id - 1].selected = true;
          newUser.cursor.loaded = false;
        }
        users[updatedUser.id] = newUser;
      }
    }

    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userConnected', { users: updatedUsers });
  }

  onUserDisconnect(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    const { disconnectedUser, updatedLoginOrders } = JSON.parse(data);
    delete users[disconnectedUser.id];
    for (const [id, loginOrder] of Object.entries(updatedLoginOrders)) {
      if (users[id]) {
        users[id].loginOrder = loginOrder;
        if (id !== user.id && users[id].cursor) {
          const color = getCursorColor(loginOrder);
          users[id].cursor.image.src = `assets/textures/cursors/${color}/default.png`;
        }
      }
      if (id === user.id) user.loginOrder = loginOrder;
    }
    if (document.body.style.cursor !== 'none') {
      gameServices.cursorSystem.showCursor();
    }
    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userDisconnected', { userId: disconnectedUser.id });
  }

  onTick(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    let updatedUsers = JSON.parse(data);
    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];
      const userTemp = users[updatedUser.id];

      if (!userTemp) { continue; }

      // Sync points for all users (including local — server is authoritative)
      userTemp.points.victories = updatedUser.points.victories;

      if (userTemp.id === user.id) { continue; }

      // Update remote player if loaded
      if (userTemp.remotePlayer?.loaded) {
        gsap.to(userTemp.remotePlayer.position, {
          x: updatedUser.localPlayer.position.x,
          y: updatedUser.localPlayer.position.y,
          duration: 0.015,
          ease: "linear"
        });
        userTemp.remotePlayer.currentSprite = updatedUser.localPlayer.currentSprite;
        userTemp.remotePlayer.flipped       = updatedUser.localPlayer.flipped;
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
    const { localPlayer, characterOption } = updatedUser;

    if (!users[updatedUser.id]) { return; }
    const userTemp = users[updatedUser.id];
    const remotePlayer = userTemp.remotePlayer;

    const characterOptions = gameState.get('characterOptions');

    // If player is loaded (chosen a character)
    if (localPlayer.loaded) {
      if (!remotePlayer.loaded) {
        remotePlayer.loadCharacter(
          localPlayer.id,
          gameData.characters[localPlayer.id]
        );
      }
      if (characterOption.id !== undefined) {
        characterOptions[characterOption.id - 1].selected = true;
      }
      if (userTemp.cursor) { userTemp.cursor.loaded = false; }
    } else {
      // Player is unloaded
      remotePlayer.loaded = false;
      if (!localPlayer.finished) {
        // Unload (right-click deselect)
        if (characterOption.id !== undefined) {
          characterOptions[characterOption.id - 1].selected = false;
        }
        if (userTemp.cursor) { userTemp.cursor.loaded = true; }
      }
    }

    // Sync finished/dead state — always update so round reset (finished: false) propagates
    userTemp.localPlayer.dead = localPlayer.dead;
    userTemp.localPlayer.lives = localPlayer.lives ?? 0;
    remotePlayer.finished = localPlayer.finished;
    remotePlayer.dead = localPlayer.dead;
    remotePlayer.deathType = localPlayer.deathType;

    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userUpdatePlayer', { user: updatedUser });
  }

  onUserChooseMap(data) {
    let updatedChooseMap = JSON.parse(data);
    gameServices.mapSystem.vote(updatedChooseMap);
    this.eventBus.emit('network:userChooseMap', { chooseMap: updatedChooseMap });
  }

  onChatMessage(data) {
    const { userId, message } = JSON.parse(data);
    gameServices.menuSystem.showChatBubble(userId, message);
  }

  onUpdateName(data) {
    const { id, name } = JSON.parse(data);
    const targetUser = gameServices.users[id];
    if (targetUser) {
      targetUser.name = name;
      gameServices.menuSystem.updatePartyPanel();
    }
  }

  setupMatchHandlers() {
    this.socket.on("ON_START_MATCH",            () =>     this.onStartMatch());
    this.socket.on("ON_CHANGE_MATCH_STATE",     (data) => this.onChangeMatchState(data));
    this.socket.on("ON_MATCH_SETTINGS_UPDATE",  (data) => this.onMatchSettingsUpdate(data));
    this.socket.on("ON_MATCH_WINNER",           (data) => this.onMatchWinner(data));
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

  onMatchSettingsUpdate(data) {
    const settings = JSON.parse(data);
    gameState.set('room.matchSettings', settings);
    gameServices.menuSystem.refreshMapMenuSettings();
    this.eventBus.emit('network:matchSettingsUpdate', { settings });
  }

  onMatchWinner(data) {
    const { winnerId } = JSON.parse(data);
    gameState.set('room.winnerId', winnerId);
    this.eventBus.emit('network:matchWinner', { winnerId });
  }

  setupObjectHandlers() {
    this.socket.on("ON_SEED",                        (data) => this.onSeed(data));
    this.socket.on("ON_USER_UPDATE_PLACEABLEOBJECT", (data) => this.onUserUpdatePlaceableObject(data));
    this.socket.on("ON_CRATE_INDEX_CONFLICT",        () => this.onCrateIndexConflict());
  }

  onSeed(data) {
    const seed = JSON.parse(data);
    gameState.set('match.seed', seed);
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
        if (!object.chose && updatedUser.placeableObject.chose) { object._restoreCrateScale(); }
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

    // Hide cursor when user chooses or places object
    if (users[updatedUser.id].cursor) {
      if (updatedUser.placeableObject.chose || updatedUser.placeableObject.placed) {
        users[updatedUser.id].cursor.loaded = false;
      }
    }

    this.eventBus.emit('network:userUpdatePlaceableObject', { user: updatedUser });
  }

  onCrateIndexConflict() {
    const user = gameServices.user;
    user.placeableObject.chose = false;
    user.placeableObject.crateIndex = undefined;
    gameServices.cursorSystem.showCursor();
  }
  
  onParticle(data) {
    const { userId, key, options, position } = JSON.parse(data);
    const remotePlayer = gameServices.users[userId]?.remotePlayer;
    if (remotePlayer?.loaded) {
      gameServices.particleSystem.add(key, position, options);
    }
  }

  onSound(data) {
    const { position, id } = JSON.parse(data);
    gameServices.soundSystem.playWorld(id, position);
  }

  // ===== Send methods =====

  sendTick() {
    const player = gameServices.player;
    const cursorSystem = gameServices.cursorSystem;

    this.socket.emit("ON_TICK", {
      localPlayer: { position: player.position, currentSprite: player.lastSprite, flipped: player.flipped },
      cursor: { position: cursorSystem.canvasPosition }
    });
  }

  sendUpdatePlayer() {
    const player = gameServices.player;
    const user = gameServices.user;
    this.socket.emit("ON_USER_UPDATE_PLAYER", {
      localPlayer: {
        id: user.localPlayer.id,
        loaded: player.loaded,
        finished: player.finished,
        dead: player.dead,
        deathType: player.deathType,
        lives: player.lives
      },
      characterOption: { id: user.characterOption.id }
    });
    gameServices.menuSystem.updatePartyPanel();
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

  sendGetRooms(callback) {
    this.socket.once('ROOMS_LIST', (data) => callback(JSON.parse(data)));
    this.socket.emit('GET_ROOMS');
  }

  sendCreateRoom(code = null) {
    this.socket.emit("CREATE_ROOM", code);
  }

  sendJoinRoom(code) {
    this.socket.emit("JOIN_ROOM", code.toUpperCase());
  }

  sendKickPlayer(targetId) {
    this.socket.emit("KICK_PLAYER", targetId);
  }

  sendChatMessage(message) {
    this.socket.emit('CHAT_MESSAGE', message);
  }

  sendUpdateName(name) {
    this.socket.emit('ON_USER_UPDATE_NAME', name);
  }

  sendParticle(key, options, position) {
    this.socket.emit('ON_PARTICLE', JSON.stringify({ key, options, position }));
  }

  sendSound(id, position) {
    this.socket.emit('ON_SOUND', JSON.stringify({ id, position }));
  }

  sendMatchSettings(settings) {
    this.socket.emit('ON_UPDATE_MATCH_SETTINGS', JSON.stringify(settings));
  }

  // ===== Helpers =====

  _clearRemoteUsers() {
    const users = gameServices.users;
    const user = gameServices.user;
    const characterOptions = gameState.get('characterOptions');

    for (const id in users) {
      if (id !== user.id) {
        delete users[id];
      }
    }

    // Reset all character option selected states
    for (const opt of characterOptions) {
      opt.selected = false;
    }
  }
}
