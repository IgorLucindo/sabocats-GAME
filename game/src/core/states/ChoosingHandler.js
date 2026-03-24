// ChoosingStateHandler - Manage "choosing" state logic
// Players select which object they want to place

import { StateHandler } from '../StateHandler.js';
import { gameServices } from '../GameServices.js';

export class ChoosingStateHandler extends StateHandler {
  constructor() {
    super("choosing");
  }

  // Entry: Setup for choosing state
  onEnter(context) {
    console.log('  🎯 Entering CHOOSING state');

    // Clear UI
    gameServices.menuSystem.clear();

    // Reset objectCrate state
    const objectCrate = gameServices.objectCrate;
    objectCrate.chose = false;
    objectCrate.placed = false;

    // Reset user's placeable object state (prevents blocking selection on second round)
    const user = gameServices.user;
    user.placeableObject.chose = false;
    user.placeableObject.placed = false;
    user.placeableObject.boxId = undefined;

    // Reset all objectCrate objects' chosen state
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].chose = false;
    }

    // Reset all remote players
    const users = gameServices.users;
    for (let id in users) {
      if (users[id].remotePlayer) {
        users[id].remotePlayer.loaded = false;
      }
    }

    // Setup camera for choosing phase
    gameServices.cameraSystem.setZoom(4 / 5);
    gameServices.cameraSystem.setPosition({ key: "middle" });

    // Show and reset mouse
    gameServices.cursorSystem.showCursor();
    gameServices.inputSystem.removeMouseListeners();
    gameServices.inputSystem.resetMouseListeners();
  }

  // Exit: Cleanup when leaving choosing state
  onExit(context) {
    console.log('  ⬅️  Exiting CHOOSING state');
  }

  // Per-frame update
  update() {
    const objectCrate = gameServices.objectCrate;

    // Update objectCrate state machine
    objectCrate.update();

    // Update all objects in choosing mode
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInChoosing();
    }
  }

  // Per-frame render
  render() {
    const objectCrate = gameServices.objectCrate;

    // Render objectCrate UI
    objectCrate.render();

    // Render all objects in choosing mode
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInChoosing();
    }
  }

  // Query state-specific information
  query(question) {
    switch (question) {
      case "isMouseVisible":
        return true;
      case "canSelectObjects":
        return true;
      case "canPlaceObjects":
        return false;
      default:
        return null;
    }
  }
}
