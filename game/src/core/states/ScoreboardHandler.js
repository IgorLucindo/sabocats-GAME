// ScoreboardStateHandler - Manage "scoreboard" state logic
// Show results, wait for timer, then return to choosing

class ScoreboardStateHandler extends StateHandler {
  constructor() {
    super("scoreboard");
  }

  // Entry: Setup for scoreboard state
  onEnter(context) {
    console.log('  📊 Entering SCOREBOARD state');

    // Start the scoreboard display timer
    // 2 second wait before showing board, then 3 seconds showing it
    matchStateMachine.startTimer("scoreboard", 5);
  }

  // Exit: Cleanup when leaving scoreboard state
  onExit(context) {
    console.log('  ⬅️  Exiting SCOREBOARD state');

    // Reset timer
    matchStateMachine.resetTimer("scoreboard");

    // Reset time markers
    time1 = 0;
    time2 = 0;
  }

  // Award victories to survivors
  _calculatePoints() {
    let noPlayerDied = true;
    for (let i in users) {
      if (users[i].id != user.id && users[i].remotePlayer.dead) {
        noPlayerDied = false;
        break;
      }
    }
    gameState.set('game.noPlayerDied', noPlayerDied);
    if (noPlayerDied && !player.dead) { return; }
    noPlayerDied = false;
    for (let i in users) {
      if (users[i].id != user.id && !users[i].remotePlayer.dead) {
        users[i].points.victories++;
      }
    }
    if (!player.dead) { user.points.victories++; }
  };

  // Per-frame update
  update() {
    // Update the scoreboard timer
    const timer = matchStateMachine.updateTimer("scoreboard");
    if (!timer) return;

    const waitTimer = 2;
    const scoreBoardTimer = 3;
    const elapsed = timer.elapsed;

    // Wait phase: 2 seconds of silence
    if (elapsed < waitTimer) {
      // Just waiting, no action
    }
    // Display phase: 3 seconds showing the board
    else if (elapsed < waitTimer + scoreBoardTimer) {
      // Only trigger board calculation/display once on transition
      if (Math.abs(elapsed - waitTimer) < deltaTime) {
        this._calculatePoints();
        menuSystem.showScoreBoard();
      }
    }
    // Complete phase: Timer done, return to choosing
    else {
      sendChangeStateToServer("choosing");
      matchStateMachine.resetTimer("scoreboard");
    }
  }

  // Per-frame render
  render() {
    // Scoreboard DOM is built by menuSystem.showScoreBoard() — no canvas rendering needed here
    // No state-specific rendering needed here
  }

  // Query state-specific information
  query(question) {
    switch (question) {
      case "isTimerActive":
        return matchStateMachine.isTimerActive("scoreboard");
      case "timerProgress":
        return matchStateMachine.getTimerProgress("scoreboard");
      case "showingBoard":
        const progress = matchStateMachine.getTimerProgress("scoreboard");
        return progress > (2 / 5); // Show after 2s wait
      default:
        return null;
    }
  }
}

const scoreboardStateHandler = new ScoreboardStateHandler();
