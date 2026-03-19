// Socket Handler - Centralized network event handling

class SocketHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.socket = io();
  }

  // Initialize all socket event handlers
  initialize() {
    this.setupConnectionHandlers();
    this.setupUserHandlers();
    this.setupMatchHandlers();
    this.setupObjectHandlers();
  }

  // Connection handlers
  setupConnectionHandlers() {
    this.socket.on("connect", () => this.onConnect());
  }

  onConnect() {
    user.id = this.socket.id;
    users[this.socket.id] = user;
    user.connected = true;
    this.eventBus.emit('network:connected', { userId: user.id });
  }

  // User-related handlers
  setupUserHandlers() {
    this.socket.on("ON_USER_CONNECT", (data) => this.onUserConnect(data));
    this.socket.on("ON_USER_DISCONNECT_UPDATE", (data) => this.onUserDisconnect(data));
    this.socket.on("ON_USER_UPDATE", (data) => this.onUserUpdate(data));
    this.socket.on("ON_USER_CHOOSE_PLAYER_UPDATE", (data) => this.onUserChoosePlayer(data));
    this.socket.on("ON_USER_CHOOSE_MAP_UPDATE", (data) => this.onUserChooseMap(data));
    this.socket.on("ON_USER_PLAYER_UPDATE", (data) => this.onUserPlayerUpdate(data));
  }

  onUserConnect(data) {
    let updatedUsers = JSON.parse(data);

    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];

      // add new users
      if (!users[updatedUser.id]) {
        const newUser = updatedUser;

        // create cursor
        newUser.cursor = new Sprite({
          position: { x: 0, y: 0 }, texture: "assets/textures/cursors/red/default.png"
        });
        newUser.cursor.gridPosition = { x: 0, y: 0 };
        newUser.cursor.previousGridPosition = { x: 0, y: 0 };

        // create online player
        if (updatedUser.onlinePlayer.loaded) {
          const onlinePlayer = entityFactory.createOnlinePlayer({
            id: updatedUser.onlinePlayer.id,
            position: updatedUser.onlinePlayer.position,
            currentSprite: updatedUser.onlinePlayer.currentSprite
          });
          let selectablePlayers = gameState.get('objects.selectablePlayers');
          selectablePlayers[updatedUser.onlineSelectablePlayer.id - 1].selected = true;
          newUser.onlinePlayer = onlinePlayer;
        }
        users[updatedUser.id] = newUser;
      }
      // add current user
      else if (users[updatedUser.id].id === user.id) {
        users[updatedUser.id] = updatedUser;
      }
    }

    this.eventBus.emit('network:userConnected', { users: updatedUsers });
  }

  onUserDisconnect(data) {
    let updatedUser = JSON.parse(data);
    delete users[updatedUser.id];
    this.eventBus.emit('network:userDisconnected', { userId: updatedUser.id });
  }

  onUserUpdate(data) {
    let updatedUsers = JSON.parse(data);
    for (let i in updatedUsers) {
      const updatedUser = updatedUsers[i];
      const userTemp = users[updatedUser.id];

      // skip if player doesn't exist or current player
      if (!userTemp || userTemp.id === user.id) { continue; }

      // online player update
      gsap.to(userTemp.onlinePlayer.position, {
        x: updatedUser.onlinePlayer.position.x,
        y: updatedUser.onlinePlayer.position.y,
        duration: 0.015,
        ease: "linear"
      });
      userTemp.onlinePlayer.currentSprite = updatedUser.onlinePlayer.currentSprite;

      // cursor update
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
    let updatedUser = JSON.parse(data);
    const onlinePlayer = entityFactory.createOnlinePlayer({
      id: updatedUser.onlinePlayer.id,
    });
    let selectablePlayers = gameState.get('objects.selectablePlayers');
    selectablePlayers[updatedUser.onlineSelectablePlayer.id - 1].selected = true;
    users[updatedUser.id].onlinePlayer = onlinePlayer;
    this.eventBus.emit('network:userChoosePlayer', { user: updatedUser });
  }

  onUserChooseMap(data) {
    let updatedChooseMap = JSON.parse(data);
    voteMap(updatedChooseMap);
    this.eventBus.emit('network:userChooseMap', { chooseMap: updatedChooseMap });
  }

  onUserPlayerUpdate(data) {
    let updatedUser = JSON.parse(data);
    const onlinePlayer = users[updatedUser.id].onlinePlayer;
    onlinePlayer.loaded = updatedUser.onlinePlayer.loaded;
    if (updatedUser.onlinePlayer.finished) {
      onlinePlayer.finished = true;
      onlinePlayer.dead = updatedUser.onlinePlayer.dead;
    }
    else {
      let selectablePlayers = gameState.get('objects.selectablePlayers');
      selectablePlayers[updatedUser.onlineSelectablePlayer.id - 1].selected = false;
    }
    this.eventBus.emit('network:userPlayerUpdate', { user: updatedUser });
  }

  // Match-related handlers
  setupMatchHandlers() {
    this.socket.on("ON_START_MATCH", () => this.onStartMatch());
    this.socket.on("ON_CHANGE_MATCH_STATE", (data) => this.onChangeMatchState(data));
  }

  onStartMatch() {
    match.start();
    this.eventBus.emit('network:matchStart');
  }

  onChangeMatchState(data) {
    let updatedState = JSON.parse(data);
    match.setState(updatedState);
    this.eventBus.emit('network:matchStateChange', { state: updatedState });
  }

  // Object-related handlers
  setupObjectHandlers() {
    this.socket.on("ON_GENERATE_BOX_OBJECTS", (data) => this.onGenerateBoxObjects(data));
    this.socket.on("ON_USER_CHOOSE_OBJECT_UPDATE", (data) => this.onUserChooseObject(data));
    this.socket.on("ON_USER_PLACE_OBJECT_UPDATE", (data) => this.onUserPlaceObject(data));
    this.socket.on("ON_USER_ROTATE_OBJECT_UPDATE", (data) => this.onUserRotateObject(data));
  }

  onGenerateBoxObjects(data) {
    let updatedSeed = JSON.parse(data);
    box.seed = updatedSeed;
    box.canOpen = true;
    this.eventBus.emit('network:generateBoxObjects', { seed: updatedSeed });
  }

  onUserChooseObject(data) {
    const [updatedUserId, updatedBoxObjectId] = JSON.parse(data);

    // update box if not updated yet
    box.update();

    // choose object
    const object = box.objects[updatedBoxObjectId];
    object.chose = true;

    // link user to chose object
    const boxObject = users[updatedUserId].boxObject;
    boxObject.boxId = updatedBoxObjectId;
    boxObject.chose = true;

    this.eventBus.emit('network:userChooseObject', { userId: updatedUserId, boxObjectId: updatedBoxObjectId });
  }

  onUserPlaceObject(data) {
    let updatedUser = JSON.parse(data);
    users[updatedUser.id].boxObject = updatedUser.boxObject;
    const object = box.objects[updatedUser.boxObject.boxId];
    object.position = updatedUser.boxObject.position;
    object.placed = true;
    object.previousPlaced = false;

    this.eventBus.emit('network:userPlaceObject', { user: updatedUser });
  }

  onUserRotateObject(data) {
    let updatedUser = JSON.parse(data);
    const updatedRotation = updatedUser.boxObject.rotation;
    users[updatedUser.id].boxObject.rotation = updatedRotation;
    const object = box.objects[updatedUser.boxObject.boxId];
    object.rotation = updatedRotation;
    if (object.auxObject) { object.auxObject.rotation = updatedRotation; }

    this.eventBus.emit('network:userRotateObject', { user: updatedUser, rotation: updatedRotation });
  }

  // Send data to server
  send(eventName, data) {
    this.socket.emit(eventName, data);
  }

  // Disconnect from server
  disconnect() {
    this.socket.disconnect();
    this.eventBus.emit('network:disconnected');
  }
}

// Create singleton instance
const socketHandler = new SocketHandler(eventBus);

// Expose socket globally for backward compatibility with sendData/*.js files
// TODO: Phase 4 - Update all sendData/*.js files to use socketHandler.send() instead
const socket = socketHandler.socket;
