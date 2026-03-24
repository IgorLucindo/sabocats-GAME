// ScoreboardStateHandler - Manage "scoreboard" state logic
// Show results, wait for timer, then transition back to choosing

import { StateHandler } from '../StateHandler.js';
import { gameServices } from '../GameServices.js';
import { deltaTime } from '../timing.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';

export class ScoreboardStateHandler extends StateHandler {
  constructor() {
    super("scoreboard");
  }

  onEnter(context) {
    Logger.debug('Entering SCOREBOARD state');
    const totalTime = GameConfig.scoreboard.waitTime + GameConfig.scoreboard.displayTime;
    gameServices.matchStateMachine.startTimer("scoreboard", totalTime);
  }

  onExit(context) {
    Logger.debug('Exiting SCOREBOARD state');
    gameServices.matchStateMachine.resetTimer("scoreboard");
  }

  _calculatePoints() {
    const user = gameServices.user;
    const users = gameServices.users;
    const player = gameServices.player;

    let noPlayerDied = true;
    for (let i in users) {
      if (users[i].id != user.id && users[i].remotePlayer.dead) {
        noPlayerDied = false;
        break;
      }
    }
    gameState.set('game.noPlayerDied', noPlayerDied);
    if (noPlayerDied && !player.dead) { return; }

    for (let i in users) {
      if (users[i].id != user.id && !users[i].remotePlayer.dead) {
        users[i].points.victories++;
      }
    }
    if (!player.dead) { user.points.victories++; }
  }

  update() {
    const timer = gameServices.matchStateMachine.updateTimer("scoreboard");
    if (!timer) return;

    const waitTime  = GameConfig.scoreboard.waitTime;
    const totalTime = waitTime + GameConfig.scoreboard.displayTime;
    const elapsed   = timer.elapsed;

    if (elapsed < waitTime) {
      // Waiting before showing scoreboard
    } else if (elapsed < totalTime) {
      if (Math.abs(elapsed - waitTime) < deltaTime) {
        this._calculatePoints();
        gameServices.menuSystem.showScoreBoard();
      }
    } else {
      gameServices.socketHandler.sendChangeState("choosing");
      gameServices.matchStateMachine.resetTimer("scoreboard");
    }
  }

  render() {}
}
