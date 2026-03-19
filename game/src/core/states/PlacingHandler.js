// PlacingStateHandler - Manage "placing" state logic
// Players place the selected object on the map

class PlacingStateHandler extends StateHandler {
  constructor() {
    super("placing");
  }

  // Entry: Setup for placing state
  onEnter(context) {
    console.log('  📍 Entering PLACING state');

    // Setup camera for placing phase
    camera.setZoom(1);
    camera.setPosition({ key: "start" });

    // Show mouse for grid placement
    mouse.showCursor();
  }

  // Exit: Cleanup when leaving placing state
  onExit(context) {
    console.log('  ⬅️  Exiting PLACING state');
  }

  // Per-frame update
  update() {
    // Update mouse state
    mouse.update();

    // Update all objects in placing mode
    for (let i in box.objects) {
      box.objects[i].updateInPlacing();
    }
  }

  // Per-frame render
  render() {
    // Render mouse for grid placement
    mouse.render();

    // Render all objects in placing mode
    for (let i in box.objects) {
      box.objects[i].renderInPlacing();
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
