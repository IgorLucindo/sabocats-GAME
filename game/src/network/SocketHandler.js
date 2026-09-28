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
    this.socket = io({ auth: { sessionId: gameState.get('user.sessionId') } });
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
    });
    this.socket.on("DEV_RELOAD", () => {
      window.location.reload();
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
    this.socket.on("ON_USER_CONNECT",                 (data) => this.onUserConnect(data));
    this.socket.on("ON_USER_RECONNECTED",             (data) => this.onUserReconnected(data));
    this.socket.on("ON_RECONNECT_HYDRATE",            (data) => this.onReconnectHydrate(data));
    this.socket.on("ON_USER_DISCONNECT_UPDATE",       (data) => this.onUserDisconnect(data));
    this.socket.on("ON_TICK",                         (data) => this.onTick(data));
    this.socket.on("ON_USER_UPDATE_PLAYER",           (data) => this.onUpdatePlayer(data));
    this.socket.on("ON_USER_UPDATE_CHARACTER_OPTION", (data) => this.onUpdateCharacterOption(data));
    this.socket.on("ON_CHARACTER_OPTION_REJECTED",    (data) => this.onCharacterOptionRejected(data));
    this.socket.on("ON_USER_UPDATE_NAME",             (data) => this.onUpdateName(data));
    this.socket.on("ON_USER_VOTE_UPDATE",             (data) => this.onUserVote(data));
    this.socket.on("ON_CHAT_MESSAGE",                 (data) => this.onChatMessage(data));
    this.socket.on("ON_PARTICLE",                     (data) => this.onParticle(data));
    this.socket.on("ON_SOUND",                        (data) => this.onSound(data));
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

        const characterId = updatedUser.localPlayer.id;
        const characterData = gameData.characters[characterId];
        if (characterId !== undefined && characterData) {
          const ps = gameServices.gameConfig.rendering.pixelScale;
          const position = updatedUser.localPlayer.position;
          newUser.remotePlayer.loadCharacter(
            characterId,
            characterData,
            position && Number.isFinite(position.x) && Number.isFinite(position.y)
              ? { x: position.x * ps, y: position.y * ps }
              : undefined,
            updatedUser.localPlayer.currentSprite
          );
          newUser.remotePlayer.loaded = !!updatedUser.localPlayer.loaded;
          if (updatedUser.localPlayer.loaded) { newUser.cursor.loaded = false; }
        }
        users[updatedUser.id] = newUser;
      }
    }

    this.syncCharacterOptions();
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
    this.syncCharacterOptions();
    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userDisconnected', { userId: disconnectedUser.id });
  }

  onUserReconnected(data) {
    const { oldId, newId, user, hostId } = JSON.parse(data);
    const existing = gameServices.users[oldId];
    if (existing) {
      const cursor = existing.cursor;
      const remotePlayer = existing.remotePlayer;
      delete gameServices.users[oldId];
      Object.assign(existing, user, { cursor, remotePlayer });
      gameServices.users[newId] = existing;
      this.onUpdatePlayer(JSON.stringify({
        id: newId,
        localPlayer: user.localPlayer,
        characterOption: user.characterOption
      }));
    } else {
      this.onUserConnect(JSON.stringify({ [newId]: user }));
    }
    if (hostId) gameState.set('room.hostId', hostId);
    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userReconnected', { oldId, newId, user });
  }

  onReconnectHydrate(data) {
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    const user = gameServices.user;
    const users = gameServices.users;
    const localUser = payload.users?.[payload.localUserId || this.socket.id];
    if (!localUser) return;

    gameState.set('room.id', payload.roomId);
    gameState.set('room.hostId', payload.hostId);
    gameState.set('room.matchSettings', payload.matchSettings);
    gameState.set('match.currentState', payload.matchState);
    gameState.set('match.seed', payload.matchSeed);
    gameState.set('match.placedObjectsHistory', payload.placedObjectsHistory || []);
    gameState.set('map.activeName', payload.mapName || undefined);

    for (const id of Object.keys(users)) delete users[id];
    Object.assign(user, localUser, {
      id: payload.localUserId || this.socket.id,
      sessionId: gameState.get('user.sessionId'),
      connected: true
    });
    users[user.id] = user;
    gameState.set('users', users);

    this.onUserConnect(JSON.stringify(payload.users));
    this._hydrateLocalPlayer(localUser);
    this.eventBus.emit('network:reconnectHydrate', payload);
    if (payload.matchState === 'placing' && localUser.cursor?.position) {
      const pixelScale = gameServices.gameConfig.rendering.pixelScale;
      gameServices.cursorSystem.restoreNetworkPosition({
        x: localUser.cursor.position.x * pixelScale,
        y: localUser.cursor.position.y * pixelScale
      });
    }
    this.eventBus.emit('network:roomJoined', {
      roomId: payload.roomId,
      hostId: payload.hostId,
      reconnected: true
    });
    gameServices.menuSystem.showPartyPanel();
    gameServices.menuSystem.updatePartyPanel();
  }

  _hydrateLocalPlayer(serverUser) {
    const player = gameServices.player;
    const localPlayer = serverUser.localPlayer;
    const characterId = serverUser.characterOption?.id;
    if (typeof characterId !== 'string') {
      player.loaded = false;
      player.characterOption = null;
      return;
    }

    // Assignments persist across rounds; loaded is only a transient gameplay flag.
    const option = gameServices.characterOptions.find(entry => entry.id === characterId);
    const characterData = gameData.characters[characterId];
    if (!option || !characterData) return;
    player.loadCharacter(characterId, characterData, option);

    const pixelScale = gameServices.gameConfig.rendering.pixelScale;
    if (localPlayer.position && Number.isFinite(localPlayer.position.x) && Number.isFinite(localPlayer.position.y)) {
      player.position.x = localPlayer.position.x * pixelScale;
      player.position.y = localPlayer.position.y * pixelScale;
    }
    if (localPlayer.velocity) {
      player.velocity.x = localPlayer.velocity.x * pixelScale;
      player.velocity.y = localPlayer.velocity.y * pixelScale;
    }
    player.loaded = !!localPlayer.loaded;
    player.finished = !!localPlayer.finished;
    player.dead = !!localPlayer.dead;
    player.deathType = localPlayer.deathType || 'default';
    player.lives = localPlayer.lives ?? 0;
    player.flipped = localPlayer.flipped ?? false;
    if (localPlayer.currentSprite) player.switchSprite(localPlayer.currentSprite);
    player.updateHitbox();
    player.updateHurtbox();
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
        const ps = gameServices.gameConfig.rendering.pixelScale;
        gsap.to(userTemp.remotePlayer.position, {
          x: updatedUser.localPlayer.position.x * ps,
          y: updatedUser.localPlayer.position.y * ps,
          duration: 0.015,
          ease: "linear"
        });
        userTemp.remotePlayer.currentSprite = updatedUser.localPlayer.currentSprite;
        userTemp.remotePlayer.flipped       = updatedUser.localPlayer.flipped;
      }

      // Update cursor always (even in lobby before players load)
      if (userTemp.cursor) {
        const ps = gameServices.gameConfig.rendering.pixelScale;
        gsap.to(userTemp.cursor.position, {
          x: updatedUser.cursor.position.x * ps,
          y: updatedUser.cursor.position.y * ps,
          duration: 0.015,
          ease: "linear"
        });
      }
    }
    this.eventBus.emit('network:userUpdate', { users: updatedUsers });
  }

  // Per-round runtime sync only (loaded/finished/dead/...). Character-option
  // assignment is a separate, low-frequency concern handled by
  // onUpdateCharacterOption below — never inferred or mutated here.
  onUpdatePlayer(data) {
    const users = gameServices.users;
    const updatedUser = typeof data === 'string' ? JSON.parse(data) : data;
    const { localPlayer } = updatedUser;
    const userTemp = users[updatedUser.id];
    if (!userTemp || !localPlayer) return;

    const characterId = userTemp.characterOption?.id;
    const isLocalUser = updatedUser.id === gameServices.user.id;
    if (isLocalUser) {
      const user = gameServices.user;
      const player = gameServices.player;
      user.localPlayer.loaded = localPlayer.loaded === true;
      user.localPlayer.finished = localPlayer.finished === true;
      user.localPlayer.dead = localPlayer.dead === true;
      user.localPlayer.deathType = localPlayer.deathType || 'default';
      user.localPlayer.lives = localPlayer.lives ?? 0;

      player.loaded = localPlayer.loaded === true && typeof characterId === 'string';
      player.finished = localPlayer.finished === true;
      player.dead = localPlayer.dead === true;
      player.deathType = localPlayer.deathType || 'default';
      player.lives = localPlayer.lives ?? 0;
    } else {
      const remotePlayer = userTemp.remotePlayer;
      userTemp.localPlayer.loaded = localPlayer.loaded === true;
      userTemp.localPlayer.finished = localPlayer.finished === true;

      if (localPlayer.loaded && typeof characterId === 'string' && gameData.characters[characterId]) {
        if (!remotePlayer.loaded || remotePlayer.characterId !== characterId) {
          remotePlayer.loadCharacter(characterId, gameData.characters[characterId]);
        }
        if (userTemp.cursor) userTemp.cursor.loaded = false;
      } else if (!localPlayer.finished) {
        remotePlayer.loaded = false;
        if (userTemp.cursor) userTemp.cursor.loaded = true;
      }

      userTemp.localPlayer.dead = localPlayer.dead;
      userTemp.localPlayer.lives = localPlayer.lives ?? 0;
      remotePlayer.finished = localPlayer.finished === true;
      remotePlayer.dead = localPlayer.dead === true;
      remotePlayer.deathType = localPlayer.deathType || 'default';
    }

    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userUpdatePlayer', { user: updatedUser });
  }

  // Character-option assignment broadcast — sent only when a player actually
  // chooses or releases a character (see sendUpdateCharacterOption()), never
  // on every tick or alongside unrelated runtime-state syncs.
  onUpdateCharacterOption(data) {
    const updatedUser = typeof data === 'string' ? JSON.parse(data) : data;
    const characterId = updatedUser.characterOption?.id;
    const userTemp = gameServices.users[updatedUser.id];
    if (!userTemp) return;

    const isLocalUser = updatedUser.id === gameServices.user.id;
    if (isLocalUser) {
      const user = gameServices.user;
      const player = gameServices.player;
      user.characterOption.id = characterId;
      user.localPlayer.id = characterId;

      if (typeof characterId === 'string' && gameData.characters[characterId]) {
        const option = gameServices.characterOptions.find(entry => entry.id === characterId);
        if (option) player.loadCharacter(characterId, gameData.characters[characterId], option);
      } else {
        player.characterOption = null;
        player.loaded = false;
      }
    } else {
      userTemp.characterOption = { id: characterId };
      userTemp.localPlayer.id = characterId;
      if (typeof characterId !== 'string' || !gameData.characters[characterId]) {
        if (userTemp.remotePlayer) userTemp.remotePlayer.loaded = false;
      }
    }

    this.syncCharacterOptions();
    gameServices.menuSystem.updatePartyPanel();
    this.eventBus.emit('network:userUpdateCharacterOption', { user: updatedUser });
  }

  // The server rejected our latest character-option claim (invalid id, already taken,
  // or the match isn't in the lobby). The payload has the same shape as a normal
  // ON_USER_UPDATE_CHARACTER_OPTION (it always targets us, carrying our own authoritative
  // assignment) plus a `reason`, so it reuses that exact reconciliation path instead of
  // duplicating it.
  onCharacterOptionRejected(data) {
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    this.onUpdateCharacterOption(payload);
    this.eventBus.emit('network:characterOptionRejected', { reason: payload.reason });
  }

  syncCharacterOptions() {
    const assignedIds = new Set();
    for (const user of Object.values(gameServices.users)) {
      const characterId = user.characterOption?.id;
      if (typeof characterId === 'string') assignedIds.add(characterId);
    }
    const localCharacterId = gameServices.user.characterOption?.id;
    if (typeof localCharacterId === 'string') assignedIds.add(localCharacterId);

    for (const option of gameState.get('characterOptions')) {
      option.selected = assignedIds.has(option.id);
    }
  }

  onUserVote(data) {
    const { userId, vote } = JSON.parse(data);
    gameServices.mapSystem.vote(userId, vote);
    this.eventBus.emit('network:userVote', { userId, vote });
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
    gameState.set('match.currentState', 'initial');
    gameServices.startMatch();
    this.eventBus.emit('network:matchStart');
  }

  onChangeMatchState(data) {
    let updatedState = JSON.parse(data);
    gameState.set('match.currentState', updatedState);
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
    const ps = gameServices.gameConfig.rendering.pixelScale;
    if (updatedUser.placeableObject.position) {
      updatedUser.placeableObject.position = {
        x: updatedUser.placeableObject.position.x * ps,
        y: updatedUser.placeableObject.position.y * ps
      };
    }
    users[updatedUser.id].placeableObject = updatedUser.placeableObject;

    // Sync visual object if it exists
    if (crateIndex !== undefined) {
      const object = objectCrate.objects[crateIndex];
      if (object && !object.previousPlaced) {
        if (!object.chose && updatedUser.placeableObject.chose) { object._restoreCrateScale(); }
        object.chose = updatedUser.placeableObject.chose;
        object.placed = updatedUser.placeableObject.placed;
        object.position = updatedUser.placeableObject.position
          ? { ...updatedUser.placeableObject.position }
          : object.position;
        object.rotation = updatedUser.placeableObject.rotation || 0;
        object.placementId = updatedUser.placeableObject.placementId;

        if (object.attachment) { object.attachment.rotation = object.rotation; }
        if (updatedUser.placeableObject.placed) {
          object.updateRotationCenter();
          object.updateCompositeObjects();
          object.checkRotation();
          if (object.attachment) { object.attachment.update(); }
          object.checkPlaceable();
          object.checkPlacement();
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
  }
  
  onParticle(data) {
    const { userId, key, options, position } = JSON.parse(data);
    const remotePlayer = gameServices.users[userId]?.remotePlayer;
    if (remotePlayer?.loaded) {
      const ps = gameServices.gameConfig.rendering.pixelScale;
      const scaledPosition = { x: position.x * ps, y: position.y * ps };
      gameServices.particleSystem.add(key, scaledPosition, options);
    }
  }

  onSound(data) {
    const { position, id } = JSON.parse(data);
    const ps = gameServices.gameConfig.rendering.pixelScale;
    const scaledPosition = { x: position.x * ps, y: position.y * ps };
    gameServices.soundSystem.playWorld(id, scaledPosition);
  }

  // ===== Send methods =====

  _getPlaceableObjectSnapshot(pixelScale) {
    const placeableState = gameServices.user.placeableObject;
    if (placeableState.crateIndex === undefined) return null;

    const object = gameServices.objectCrate.objects[placeableState.crateIndex];
    const position = object?.position || placeableState.position;
    return {
      crateIndex: placeableState.crateIndex,
      chose: placeableState.chose,
      placed: placeableState.placed,
      position: position ? { x: position.x / pixelScale, y: position.y / pixelScale } : undefined,
      rotation: object?.rotation ?? placeableState.rotation,
      objectId: object?.id ?? placeableState.objectId,
      hasExplosion: object ? !!object.explosion : !!placeableState.hasExplosion,
      placementId: placeableState.placementId
    };
  }

  sendTick() {
    const player = gameServices.player;
    const cursorSystem = gameServices.cursorSystem;
    const ps = gameServices.gameConfig.rendering.pixelScale;

    this.socket.emit("ON_TICK", {
      localPlayer: {
        position: { x: player.position.x / ps, y: player.position.y / ps },
        velocity: { x: player.velocity.x / ps, y: player.velocity.y / ps },
        currentSprite: player.lastSprite,
        flipped: player.flipped
      },
      placeableObject: this._getPlaceableObjectSnapshot(ps),
      cursor: { position: { x: cursorSystem.networkPosition.x / ps, y: cursorSystem.networkPosition.y / ps } }
    });
  }

  sendUpdatePlayer() {
    const player = gameServices.player;
    this.socket.emit("ON_USER_UPDATE_PLAYER", {
      localPlayer: {
        loaded: player.loaded,
        finished: player.finished,
        dead: player.dead,
        deathType: player.deathType,
        lives: player.lives
      }
    });
    gameServices.menuSystem.updatePartyPanel();
  }

  // Sent only when the player actually chooses or releases a character
  // (see CharacterOption._choose() and Player.reselectPlayer()) — a distinct,
  // low-frequency action from the per-round runtime sync in sendUpdatePlayer().
  // Pass undefined to release the current character.
  sendUpdateCharacterOption(characterId) {
    this.socket.emit("ON_USER_UPDATE_CHARACTER_OPTION", { id: characterId });
  }

  sendVote(vote) {
    this.socket.emit("ON_USER_VOTE", vote);
  }

  sendLeaveRoom(callback) {
    this.socket.emit('LEAVE_ROOM', callback);
  }

  sendJoinMatch() {
    this.socket.emit("ON_USER_JOIN_MATCH");
  }

  sendChangeState(state) {
    this.socket.emit("ON_USER_CHANGE_MATCH_STATE", state);
  }

  sendUpdatePlaceableObject() {
    const user = gameServices.user;
    const ps = gameServices.gameConfig.rendering.pixelScale;
    const po = user.placeableObject;
    const object = gameServices.objectCrate.objects[po.crateIndex];
    if (po.placed && !po.placementId) {
      const roundKey = gameState.get('match.seed');
      po.placementId = `${user.sessionId || user.id}:${roundKey}`;
      if (object) { object.placementId = po.placementId; }
    }
    this.socket.emit("ON_USER_UPDATE_PLACEABLEOBJECT", {
      ...po,
      objectId: object?.id ?? po.objectId,
      hasExplosion: object ? !!object.explosion : !!po.hasExplosion,
      position: po.position ? { x: po.position.x / ps, y: po.position.y / ps } : po.position
    });
  }

  sendRemovePlacedObjects(removal) {
    this.socket.emit('ON_REMOVE_PLACED_OBJECTS', removal);
  }

  sendActiveMap(mapName) {
    this.socket.emit('ON_USER_ACTIVE_MAP', mapName);
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
    const ps = gameServices.gameConfig.rendering.pixelScale;
    this.socket.emit('ON_PARTICLE', JSON.stringify({ key, options, position: { x: position.x / ps, y: position.y / ps } }));
  }

  sendSound(id, position) {
    const ps = gameServices.gameConfig.rendering.pixelScale;
    this.socket.emit('ON_SOUND', JSON.stringify({ id, position: { x: position.x / ps, y: position.y / ps } }));
  }

  sendMatchSettings(settings) {
    this.socket.emit('ON_UPDATE_MATCH_SETTINGS', JSON.stringify(settings));
  }

  // ===== Helpers =====

  _clearRemoteUsers() {
    const users = gameServices.users;
    const user = gameServices.user;

    for (const id in users) {
      if (id !== user.id) delete users[id];
    }

    this.syncCharacterOptions();
  }
}
