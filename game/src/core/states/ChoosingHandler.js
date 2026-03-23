// ChoosingStateHandler - Manage "choosing" state logic
// Players select which object they want to place

class ChoosingStateHandler extends StateHandler {
  constructor() {
    super("choosing");
  }

  // Entry: Setup for choosing state
  onEnter(context) {
    console.log('  🎯 Entering CHOOSING state');

    // Clear UI
    menuSystem.clear();

    // Reset objectCrate state
    objectCrate.chose = false;
    objectCrate.placed = false;

    // Reset user's placeable object state (prevents blocking selection on second round)
    user.placeableObject.chose = false;
    user.placeableObject.placed = false;
    user.placeableObject.boxId = undefined;

    // Reset all objectCrate objects' chosen state
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].chose = false;
    }

    // Reset all remote players
    for (let id in users) {
      if (users[id].remotePlayer) {
        users[id].remotePlayer.loaded = false;
      }
    }

    // Setup camera for choosing phase
    cameraSystem.setZoom(4 / 5);
    cameraSystem.setPosition({ key: "middle" });

    // Show and reset mouse
    cursorSystem.showCursor();
    inputSystem.removeMouseListeners();
    inputSystem.resetMouseListeners();
  }

  // Exit: Cleanup when leaving choosing state
  onExit(context) {
    console.log('  ⬅️  Exiting CHOOSING state');
  }

  // Per-frame update
  update() {
    // Update objectCrate state machine
    objectCrate.update();

    // Update all objects in choosing mode
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInChoosing();
    }
  }

  // Per-frame render
  render() {
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

const choosingStateHandler = new ChoosingStateHandler();
