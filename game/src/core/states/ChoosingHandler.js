// ChoosingStateHandler - Manage "choosing" state logic
// Players select which object they want to place

import { StateHandler } from '../StateHandler.js';
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

    const user = gameServices.user;
    user.placeableObject.chose = false;
    user.placeableObject.placed = false;
    user.placeableObject.crateIndex = undefined;

    for (let i in objectCrate.objects) {
      objectCrate.objects[i].chose = false;
    }

    const users = gameServices.users;
    for (let id in users) {
      if (users[id].remotePlayer) { users[id].remotePlayer.loaded = false; }
      if (users[id].cursor) { users[id].cursor.loaded = true; }
    }

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
