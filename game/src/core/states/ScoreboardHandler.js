// ScoreboardStateHandler - Manage "scoreboard" state logic
// Show results, wait for timer, then transition back to choosing (or lobby if match winner)

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { gameState } from '../GameState.js';
import { Logger } from '../Logger.js';
import { GameConfig } from '../DataLoader.js';

export class ScoreboardStateHandler extends StateHandler {
  constructor() {
    super("scoreboard");
    this._winnerShown = false;
  }

  onEnter(context) {
    Logger.debug('Entering SCOREBOARD state');
    this._shown       = false;
    this._exitStarted = false;
    this._winnerShown = false;
    gameServices.cursorSystem.hideCursor();
    const cfg = GameConfig.states.scoreboard;
    gameServices.matchStateMachine.startTimer("scoreboard", cfg.waitDuration + cfg.displayDuration);
  }

  onExit(context) {
    Logger.debug('Exiting SCOREBOARD state');
    gameServices.matchStateMachine.resetTimer("scoreboard");
    gameServices.menuSystem.resetIconStates();
    gameServices.menuSystem.hideWinner();
  }

  update() {
    const timer = gameServices.matchStateMachine.updateTimer("scoreboard");
    if (!timer) return;

    const cfg     = GameConfig.states.scoreboard;
    const elapsed = timer.elapsed;

    // Phase 2: winner display
    if (this._winnerShown) {
      if (elapsed >= cfg.winDisplayDuration) {
        gameState.set('room.winnerId', undefined);
        gameServices.socketHandler.sendChangeState("lobby");
        gameServices.matchStateMachine.resetTimer("scoreboard");
      }
      return;
    }

    // Phase 1: scoreboard
    const totalTime = cfg.waitDuration + cfg.displayDuration;

    if (!this._shown && elapsed >= cfg.waitDuration) {
      this._shown = true;
      gameServices.menuSystem.showScoreBoard();
    }

    if (!this._exitStarted && elapsed >= totalTime - 0.55) {
      this._exitStarted = true;
      gameServices.menuSystem.startScoreBoardExit();
    }

    if (elapsed < totalTime) return;

    const winnerId = gameState.get('room.winnerId');
    if (winnerId) {
      this._winnerShown = true;
      gameServices.menuSystem.showWinner(winnerId);
      gameServices.matchStateMachine.startTimer("scoreboard", cfg.winDisplayDuration);
    } else {
      gameServices.socketHandler.sendChangeState("choosing");
      gameServices.matchStateMachine.resetTimer("scoreboard");
    }
  }

  render() {}
}
