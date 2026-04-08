// InitialStateHandler - Transient intro state at the start of a match
// Pans the camera across the map before entering choosing

import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { GameConfig } from '../DataLoader.js';

export class InitialStateHandler extends StateHandler {
  constructor() {
    super("initial");
    this._phase = 0;
  }

  onEnter(context) {
    this._phase = 0;
    gameServices.player.loaded = false;
    const users = gameServices.users;
    for (let id in users) {
      if (users[id].remotePlayer) { users[id].remotePlayer.loaded = false; }
    }
    const camera = gameServices.cameraSystem;
    camera.snapZoom(camera.getOverviewZoom());
    camera.setPosition({ key: "middle" });
    gameServices.matchStateMachine.startTimer("intro", GameConfig.states.initial.middleViewDuration);
  }

  onExit(context) {
    gameServices.matchStateMachine.resetTimer("intro");
  }

  update() {
    const msm    = gameServices.matchStateMachine;
    const cfg    = GameConfig.states.initial;
    const camera = gameServices.cameraSystem;

    msm.updateTimer("intro");
    if (!msm.isTimerComplete("intro")) { return; }

    if (this._phase === 0) {
      this._phase = 1;
      camera.setZoom(GameConfig.camera.choosingZoom);
      camera.moveTo({ key: "finishArea" });
      msm.startTimer("intro", cfg.finishAreaViewDuration);
    } else if (this._phase === 1) {
      this._phase = 2;
      camera.moveTo({ key: "spawnArea" });
      msm.startTimer("intro", cfg.spawnAreaViewDuration);
    } else if (this._phase === 2) {
      msm.setState("choosing");
    }
  }

  render() {}
}
