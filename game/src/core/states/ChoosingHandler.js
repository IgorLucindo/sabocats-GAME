// ChoosingStateHandler - Manage "choosing" state logic
// Players select which object they want to place

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { GameConfig } from '../DataLoader.js';
import { Logger } from '../Logger.js';

export class ChoosingStateHandler extends StateHandler {
  constructor() {
    super("choosing");
  }

  onEnter(context) {
    Logger.debug('Entering CHOOSING state');

    gameServices.menuSystem.clear();

    const objectCrate = gameServices.objectCrate;
    objectCrate.chose = false;
    objectCrate.placed = false;

    for (let i in objectCrate.objects) {
      objectCrate.objects[i].chose = false;
    }

    // Reset placeableObject for ALL users (clears stale chose/placed from previous round)
    // Note: users[localId] may be a JSON copy (not same object as gameServices.user) after
    // onUserConnect overwrites it, so we reset gameServices.user explicitly too.
    const user = gameServices.user;
    user.placeableObject.chose = false;
    user.placeableObject.placed = false;
    user.placeableObject.crateIndex = undefined;
    user.placeableObject.rotation = 0;

    const users = gameServices.users;
    for (let id in users) {
      if (users[id].id !== user.id) {
        users[id].placeableObject.chose = false;
        users[id].placeableObject.placed = false;
        users[id].placeableObject.crateIndex = undefined;
        users[id].placeableObject.rotation = 0;
      }
      if (users[id].remotePlayer) { users[id].remotePlayer.loaded = false; }
      if (users[id].cursor) { users[id].cursor.loaded = true; }
    }

    // Reset finished/dead before re-announcing — prevents the server from
    // treating the previous round's finished state as a new finish event
    const player = gameServices.player;
    player.finished = false;
    player.dead = false;
    player.loaded = false;

    // Re-announce local player's current character state so all peers
    // can re-load the remote player after the reset above
    gameServices.socketHandler.sendUpdatePlayer();

    gameServices.cameraSystem.setZoom(GameConfig.camera.choosingZoom);
    gameServices.cameraSystem.setPosition({ key: "middle" });

    gameServices.cursorSystem.showCursor();
    gameServices.inputSystem.resetMouseListeners();
  }

  onExit(context) {
    Logger.debug('Exiting CHOOSING state');
  }

  update() {
    const objectCrate = gameServices.objectCrate;
    objectCrate.update();
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInChoosing();
    }
  }

  render() {
    const objectCrate = gameServices.objectCrate;
    objectCrate.render();
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInChoosing();
    }
  }

}
