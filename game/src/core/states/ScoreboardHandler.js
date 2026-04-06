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
    this._shown = false;
    gameServices.cursorSystem.hideCursor();
    const totalTime = GameConfig.states.scoreboard.waitDuration + GameConfig.states.scoreboard.displayDuration;
    gameServices.matchStateMachine.startTimer("scoreboard", totalTime);
  }

  onExit(context) {
    Logger.debug('Exiting SCOREBOARD state');
    gameServices.matchStateMachine.resetTimer("scoreboard");
  }

  update() {
    const timer = gameServices.matchStateMachine.updateTimer("scoreboard");
    if (!timer) return;

    const waitDuration  = GameConfig.states.scoreboard.waitDuration;
    const totalTime     = waitDuration + GameConfig.states.scoreboard.displayDuration;
    const exitAnimStart = totalTime - 0.55;
    const elapsed       = timer.elapsed;

    if (elapsed >= totalTime) {
      gameServices.socketHandler.sendChangeState("choosing");
      gameServices.matchStateMachine.resetTimer("scoreboard");
      return;
    }

    if (!this._shown && elapsed >= waitDuration) {
      this._shown = true;
      gameServices.menuSystem.showScoreBoard();
    }

    if (elapsed >= exitAnimStart && Math.abs(elapsed - exitAnimStart) < deltaTime) {
      gameServices.menuSystem.startScoreBoardExit();
    }
  }

  render() {}
}
