// PlayingStateHandler - Manage "playing" state logic
// Game is active, players move and complete objectives

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';
import { deltaTime } from '../timing.js';

export class PlayingStateHandler extends StateHandler {
  constructor() {
    super("playing");
    this._timeInState = 0;
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

    this._timeInState = 0;
    gameServices.spectatorSystem.stop();
  }

  // Exit: Cleanup when leaving playing state
  onExit(context) {
    Logger.debug('Exiting PLAYING state');
    gameServices.menuSystem.hideHint();
    gameServices.spectatorSystem.stop();
  }

  // Per-frame update
  update() {
    const player = gameServices.player;
    const keys   = gameServices.inputSystem.keys;
    const cfg    = gameServices.gameConfig.states.playing;

    if (player.finished) {
      gameServices.spectatorSystem.start('player');
      return;
    }

    if (!player.loaded) {
      gameServices.menuSystem.hideHint();
      return;
    }

    this._timeInState += deltaTime;

    if (this._timeInState >= cfg.giveUpHintDelay) {
      gameServices.menuSystem.showHintWithBar('HOLD G TO GIVE UP');
    }

    const holdTime = keys.g.holdTime;
    gameServices.menuSystem.updateHintBar(holdTime / cfg.giveUpHoldDuration);
    if (holdTime >= cfg.giveUpHoldDuration) {
      player.die();
      gameServices.menuSystem.hideHint();
    }
  }

  // Per-frame render
  render() {}
}
