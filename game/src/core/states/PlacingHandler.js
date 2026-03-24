// PlacingStateHandler - Manage "placing" state logic
// Players place the selected object on the map

import { StateHandler } from '../StateHandler.js';
import { gameServices } from '../GameServices.js';

export class PlacingStateHandler extends StateHandler {
  constructor() {
    super("placing");
  }

  // Entry: Setup for placing state
  onEnter(context) {
    console.log('  📍 Entering PLACING state');

    // Setup camera for placing phase
    gameServices.cameraSystem.setZoom(1);
    gameServices.cameraSystem.setPosition({ key: "start" });

    // Show cursor for grid placement
    gameServices.cursorSystem.showCursor();
  }

  // Exit: Cleanup when leaving placing state
  onExit(context) {
    console.log('  ⬅️  Exiting PLACING state');
  }

  // Per-frame update
  update() {
    const objectCrate = gameServices.objectCrate;

    // Update all objects in placing mode
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInPlacing();
    }
  }

  // Per-frame render
  render() {
    const objectCrate = gameServices.objectCrate;

    // Render cursor for grid placement
    gameServices.cursorSystem.render();

    // Render all objects in placing mode
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInPlacing();
    }
  }

  // Query state-specific information
  query(question) {
    switch (question) {
      case "isMouseVisible":
        return true;
      case "canSelectObjects":
        return false;
      case "canPlaceObjects":
        return true;
      default:
        return null;
    }
  }
}
