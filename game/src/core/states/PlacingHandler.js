// PlacingStateHandler - Manage "placing" state logic
// Players place the selected object on the map

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { GameConfig } from '../DataLoader.js';
import { Logger } from '../Logger.js';

export class PlacingStateHandler extends StateHandler {
  constructor() {
    super("placing");
  }

  onEnter(context) {
    Logger.debug('Entering PLACING state');

    gameServices.cameraSystem.setZoom(GameConfig.camera.placingZoom);
    gameServices.cameraSystem.moveTo({ key: "spawnArea" });

    gameServices.cursorSystem.showCursor();

    const users = gameServices.users;
    for (let id in users) {
      if (users[id].cursor) { users[id].cursor.loaded = true; }
    }
  }

  onExit(context) {
    Logger.debug('Exiting PLACING state');
  }

  update() {
    const objectCrate = gameServices.objectCrate;
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInPlacing();
    }
  }

  render() {
    const objectCrate = gameServices.objectCrate;
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInPlacing();
    }
  }

}
