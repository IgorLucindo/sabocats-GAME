// PlayingStateHandler - Manage "playing" state logic
// Game is active, players move and complete objectives

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';

export class PlayingStateHandler extends StateHandler {
  constructor() {
    super("playing");
  }

  // Entry: Setup for playing state
  onEnter(context) {
    Logger.debug('Entering PLAYING state');

    const player = gameServices.player;
    const users = gameServices.users;
    const user = gameServices.user;

    const spawnArea = gameState.get('map.spawnArea');
    const spawnSeed = gameState.get('match.spawnSeed');

    // Get spawn position for this player using loginOrder as index
    const spawnIndex = user.loginOrder - 1;  // loginOrder is 1-based
    const spawnOrder = spawnSeed[spawnIndex];
    const numPlayers = spawnSeed.length;

    const hitboxOffsetX = GameConfig.player.hitboxOffsetX * player.scale;
    const maxX = spawnArea.position.x + spawnArea.width - hitboxOffsetX - player.hitbox.width;
    const position = {
      x: Math.min(spawnArea.position.x + spawnOrder * (spawnArea.width / numPlayers), maxX),
      y: spawnArea.position.y + spawnArea.height - player.hitbox.height - 1
    };

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
