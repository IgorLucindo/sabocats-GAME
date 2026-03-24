import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';
import { Sprite } from '../entities/Sprite.js';

// Socket Handler - Centralized network event handling

export class SocketHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.socket = io();
  }

  initialize() {
    this.setupConnectionHandlers();
    this.setupUserHandlers();
    this.setupMatchHandlers();
    this.setupObjectHandlers();
  }

  setupConnectionHandlers() {
    this.socket.on("connect", () => this.onConnect());
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
    this.socket.on("ON_USER_UPDATE",               (data) => this.onUserUpdate(data));
    this.socket.on("ON_USER_CHOOSE_PLAYER_UPDATE", (data) => this.onUserChoosePlayer(data));
    this.socket.on("ON_USER_CHOOSE_MAP_UPDATE",    (data) => this.onUserChooseMap(data));
    this.socket.on("ON_USER_PLAYER_UPDATE",        (data) => this.onUserPlayerUpdate(data));
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

        if (updatedUser.onlinePlayer.loaded) {
          const remotePlayer = gameServices.entityFactory.createRemotePlayer({
            id: updatedUser.onlinePlayer.id,
            position: updatedUser.onlinePlayer.position,
            currentSprite: updatedUser.onlinePlayer.currentSprite
          });
          let characterOptions = gameState.get('objects.characterOptions');
          characterOptions[updatedUser.onlineSelectablePlayer.id - 1].selected = true;
          newUser.remotePlayer = remotePlayer;
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

  onUserUpdate(data) {
    const users = gameServices.users;
    const user = gameServices.user;
    let updatedUsers = JSON.parse(data);
    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];
      const userTemp = users[updatedUser.id];

      if (!userTemp || userTemp.id === user.id) { continue; }

      gsap.to(userTemp.remotePlayer.position, {
        x: updatedUser.onlinePlayer.position.x,
        y: updatedUser.onlinePlayer.position.y,
        duration: 0.015,
        ease: "linear"
      });
      userTemp.remotePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;

      gsap.to(userTemp.cursor.position, {
        x: updatedUser.cursor.position.x,
        y: updatedUser.cursor.position.y,
        duration: 0.015,
        ease: "linear"
      });
    }
    this.eventBus.emit('network:userUpdate', { users: updatedUsers });
  }

  onUserChoosePlayer(data) {
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    const remotePlayer = gameServices.entityFactory.createRemotePlayer({
      id: updatedUser.onlinePlayer.id,
    });
    let characterOptions = gameState.get('objects.characterOptions');
    characterOptions[updatedUser.onlineSelectablePlayer.id - 1].selected = true;
    users[updatedUser.id].remotePlayer = remotePlayer;
    this.eventBus.emit('network:userChoosePlayer', { user: updatedUser });
  }

  onUserChooseMap(data) {
    let updatedChooseMap = JSON.parse(data);
    gameServices.mapSystem.vote(updatedChooseMap);
    this.eventBus.emit('network:userChooseMap', { chooseMap: updatedChooseMap });
  }

  onUserPlayerUpdate(data) {
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    const remotePlayer = users[updatedUser.id].remotePlayer;
    remotePlayer.loaded = updatedUser.onlinePlayer.loaded;
    if (updatedUser.onlinePlayer.finished) {
      remotePlayer.finished = true;
      remotePlayer.dead = updatedUser.onlinePlayer.dead;
    } else {
      let characterOptions = gameState.get('objects.characterOptions');
      characterOptions[updatedUser.onlineSelectablePlayer.id - 1].selected = false;
    }
    this.eventBus.emit('network:userPlayerUpdate', { user: updatedUser });
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
    this.socket.on("ON_GENERATE_BOX_OBJECTS",      (data) => this.onGeneratePlaceableObjects(data));
    this.socket.on("ON_USER_CHOOSE_OBJECT_UPDATE",  (data) => this.onUserChooseObject(data));
    this.socket.on("ON_USER_PLACE_OBJECT_UPDATE",   (data) => this.onUserPlaceObject(data));
    this.socket.on("ON_USER_ROTATE_OBJECT_UPDATE",  (data) => this.onUserRotateObject(data));
  }

  onGeneratePlaceableObjects(data) {
    const objectCrate = gameServices.objectCrate;
    let updatedSeed = JSON.parse(data);
    objectCrate.seed = updatedSeed;
    objectCrate.canOpen = true;
    this.eventBus.emit('network:generatePlaceableObjects', { seed: updatedSeed });
  }

  onUserChooseObject(data) {
    const objectCrate = gameServices.objectCrate;
    const users = gameServices.users;
    const [updatedUserId, updatedBoxObjectId] = JSON.parse(data);

    objectCrate.update();

    const object = objectCrate.objects[updatedBoxObjectId];
    object.chose = true;

    const placeableObject = users[updatedUserId].placeableObject;
    placeableObject.boxId = updatedBoxObjectId;
    placeableObject.chose = true;

    this.eventBus.emit('network:userChooseObject', { userId: updatedUserId, boxObjectId: updatedBoxObjectId });
  }

  onUserPlaceObject(data) {
    const objectCrate = gameServices.objectCrate;
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    users[updatedUser.id].placeableObject = updatedUser.boxObject;
    const object = objectCrate.objects[updatedUser.boxObject.boxId];
    object.position = updatedUser.boxObject.position;
    object.placed = true;
    object.previousPlaced = false;

    this.eventBus.emit('network:userPlaceObject', { user: updatedUser });
  }

  onUserRotateObject(data) {
    const objectCrate = gameServices.objectCrate;
    const users = gameServices.users;
    let updatedUser = JSON.parse(data);
    const updatedRotation = updatedUser.boxObject.rotation;
    users[updatedUser.id].placeableObject.rotation = updatedRotation;
    const object = objectCrate.objects[updatedUser.boxObject.boxId];
    object.rotation = updatedRotation;
    if (object.attachment) { object.attachment.rotation = updatedRotation; }

    this.eventBus.emit('network:userRotateObject', { user: updatedUser, rotation: updatedRotation });
  }

  // ===== Send methods =====

  sendPlayerAndCursorPosition() {
    const player = gameServices.player;
    const cursorSystem = gameServices.cursorSystem;
    this.socket.emit("ON_USER", {
      onlinePlayer: { position: player.position, currentSprite: player.lastSprite },
      cursor: { position: cursorSystem.canvasPosition }
    });
  }

  sendCurrentPlayer(playerId, selectablePlayerId) {
    this.socket.emit("ON_USER_CHOOSE_PLAYER", {
      onlinePlayer: { id: playerId },
      onlineSelectablePlayer: { id: selectablePlayerId }
    });
  }

  sendUnloadPlayer() {
    this.socket.emit("ON_USER_PLAYER_UNLOAD");
  }

  sendFinishedPlayer() {
    const player = gameServices.player;
    this.socket.emit("ON_USER_PLAYER_FINISH", player.dead);
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

  sendChooseObject(boxId) {
    this.socket.emit("ON_USER_CHOOSE_OBJECT", boxId);
  }

  sendPlaceObject(placeableObject) {
    this.socket.emit("ON_USER_PLACE_OBJECT", placeableObject);
  }

  sendRotateObject() {
    const user = gameServices.user;
    this.socket.emit("ON_USER_ROTATE_OBJECT", user.placeableObject);
  }
}
