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
    clearDivMenu();

    // Reset box state
    box.chose = false;
    box.placed = false;

    // Reset all online players
    for (let id in users) {
      if (users[id].onlinePlayer) {
        users[id].onlinePlayer.loaded = false;
      }
    }

    // Setup camera for choosing phase
    camera.setZoom(4 / 5);
    camera.setPosition({ key: "middle" });

    // Show and reset mouse
    mouse.showCursor();
    removeMouseEvents();
    resetMouseEvents();
  }

  // Exit: Cleanup when leaving choosing state
  onExit(context) {
    console.log('  ⬅️  Exiting CHOOSING state');
  }

  // Per-frame update
  update() {
    // Update box state machine
    box.update();

    // Update all objects in choosing mode
    for (let i in box.objects) {
      box.objects[i].updateInChoosing();
    }
  }

  // Per-frame render
  render() {
    // Render box UI
    box.render();

    // Render all objects in choosing mode
    for (let i in box.objects) {
      box.objects[i].renderInChoosing();
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
