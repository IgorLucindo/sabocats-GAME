// PlacingStateHandler - Manage "placing" state logic
// Players place the selected object on the map

import { StateHandler } from '../StateHandler.js';
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
    gameServices.cameraSystem.setPosition({ key: "start" });

    gameServices.cursorSystem.showCursor();
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
    gameServices.cursorSystem.render();
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInPlacing();
    }
  }

}
