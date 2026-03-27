// ScoreboardStateHandler - Manage "scoreboard" state logic
// Show results, wait for timer, then transition back to choosing

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { deltaTime } from '../timing.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';

export class ScoreboardStateHandler extends StateHandler {
  constructor() {
    super("scoreboard");
  }

  onEnter(context) {
    Logger.debug('Entering SCOREBOARD state');
    gameServices.cursorSystem.hideCursor();
    const totalTime = GameConfig.scoreboard.waitTime + GameConfig.scoreboard.displayTime;
    gameServices.matchStateMachine.startTimer("scoreboard", totalTime);
  }

  onExit(context) {
    Logger.debug('Exiting SCOREBOARD state');
    gameServices.matchStateMachine.resetTimer("scoreboard");
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
        gameServices.menuSystem.showScoreBoard();
      }
    } else {
      gameServices.socketHandler.sendChangeState("choosing");
      gameServices.matchStateMachine.resetTimer("scoreboard");
    }
  }

  render() {}
}
