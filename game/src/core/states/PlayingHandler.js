// PlayingStateHandler - Manage "playing" state logic
// Game is active, players move and complete objectives

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';

export class PlayingStateHandler extends StateHandler {
  constructor() {
    super("playing");
  }

  // Entry: Setup for playing state
  onEnter(context) {
    Logger.debug('Entering PLAYING state');

    const player = gameServices.player;
    const users = gameServices.users;

    const startArea = gameState.get('map.startArea');
    const position = startArea
      ? { x: startArea.position.x + Math.random() * startArea.width, y: startArea.position.y }
      : { x: 0, y: 0 };
    player.prepareForMatch(position);

    for (let id in users) {
      users[id].remotePlayer?.resetForMatch();
    }

    // Re-announce loaded state so peers can display this player's character
    // Fixes race condition where a remote reset in ChoosingHandler left one
    // player's remote character unloaded when the playing state starts
    gameServices.socketHandler.sendUpdatePlayer();

    gameServices.inputSystem.removeMouseListeners();
    gameServices.cursorSystem.hideCursor();
  }

  // Exit: Cleanup when leaving playing state
  onExit(context) {
    Logger.debug('Exiting PLAYING state');
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

}
