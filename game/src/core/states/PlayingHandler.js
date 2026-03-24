// PlayingStateHandler - Manage "playing" state logic
// Game is active, players move and complete objectives

import { StateHandler } from '../StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../gameState.js';

export class PlayingStateHandler extends StateHandler {
  constructor() {
    super("playing");
  }

  // Entry: Setup for playing state
  onEnter(context) {
    console.log('  🎮 Entering PLAYING state');

    const player = gameServices.player;
    const users = gameServices.users;

    // Reset player position to random start FIRST (before marking as loaded)
    const startArea = gameState.get('map.startArea');
    if (startArea) {
      player.position.x = startArea.position.x + Math.random() * startArea.width;
      player.position.y = startArea.position.y;
    }

    // Reset player velocity
    player.velocity.x = 0;
    player.velocity.y = 0;

    // NOW reset player state (after position is set)
    player.dead = false;
    player.finished = false;
    player.loaded = true;

    // Reset all online players
    for (let id in users) {
      if (users[id].remotePlayer) {
        users[id].remotePlayer.loaded = false;
        users[id].remotePlayer.dead = false;
        users[id].remotePlayer.finished = false;
      }
    }

    // Remove mouse events for gameplay
    gameServices.inputSystem.removeMouseListeners();
  }

  // Exit: Cleanup when leaving playing state
  onExit(context) {
    console.log('  ⬅️  Exiting PLAYING state');
  }

  // Per-frame update
  update() {
    // No state-specific update logic for playing
    // Game logic is handled by players, objects, physics engine
  }

  // Per-frame render
  render() {
    // No state-specific rendering for playing
    // All entities render in their own update
  }

  // Query state-specific information
  query(question) {
    switch (question) {
      case "isGameActive":
        return true;
      case "canMove":
        return true;
      case "canInteract":
        return true;
      default:
        return null;
    }
  }
}
