// PlayingStateHandler - Manage "playing" state logic
// Game is active, players move and complete objectives

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';
import { deltaTime } from '../timing.js';
import { syncedRandom } from '../../helpers.js';

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

    // Calculate and apply spawn position for this player
    const position = this.calculateSpawnPosition();
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
    gameServices.cameraSystem.setZoom(GameConfig.camera.placingZoom);

    this._timeInState = 0;
    gameServices.spectatorSystem.stop();
    gameServices.soundSystem.play('start');
    gameServices.animationSystem.updatePlacedObjects("animated");
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
      gameServices.menuSystem.showHintWithBar('HOLD [g] TO GIVE UP');
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

  // Calculate spawn position for the local player (synced across all clients)
  calculateSpawnPosition() {
    const seed = gameState.get('match.seed');
    const player = gameServices.player;
    const users = gameServices.users;
    const user = gameServices.user;
    const spawnArea = gameServices.spawnArea;

    // Generate randomized spawn order using Fisher-Yates shuffle
    const playerCount = Object.keys(users).length;
    const spawnOrder = Array.from({length: playerCount}, (_, i) => i);
    
    for (let i = spawnOrder.length - 1; i > 0; i--) {
      const rng = syncedRandom(seed + (spawnOrder.length - i));
      const j = Math.floor(rng * (i + 1));
      [spawnOrder[i], spawnOrder[j]] = [spawnOrder[j], spawnOrder[i]];
    }
    
    gameState.set('match.spawnSeed', spawnOrder);

    // Get this player's spawn slot
    const spawnIndex = user.loginOrder - 1;  // loginOrder is 1-based
    const spawnSlot = spawnOrder[spawnIndex];
    
    // Divide spawn area into equal sections, one per player
    const sectionWidth = spawnArea.hitbox.width / playerCount;
    const spawnX = spawnArea.hitbox.position.x + (spawnSlot * sectionWidth);
    
    // Ensure player doesn't spawn outside the area (account for hitbox offsets)
    const hitboxOffsetX = GameConfig.player.hitbox.offset.x * player.scale;
    const maxX = spawnArea.hitbox.position.x + spawnArea.hitbox.width - hitboxOffsetX - player.hitbox.width;
    const clampedX = Math.min(spawnX, maxX);
    
    return {
      x: clampedX,
      y: spawnArea.hitbox.position.y + spawnArea.hitbox.height - GameConfig.player.hitbox.offset.y * player.scale - player.hitbox.height - 1
    };
  }
}
