// StateHandler - Base class for game state handlers
// Each state (choosing, placing, playing, scoreboard) has a handler that manages its logic

export class StateHandler {
  constructor(name) {
    this.name = name;
  }

  // Called when entering this state
  onEnter(context) {}

  // Called when exiting this state
  onExit(context) {}

  // Called every frame while in this state
  update() {}

  // Called every frame for rendering while in this state
  render() {}
}
