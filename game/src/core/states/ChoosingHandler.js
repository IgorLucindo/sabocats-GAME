import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';
import { GameConfig } from '../DataLoader.js';
import { Logger } from '../Logger.js';

export class ChoosingStateHandler extends StateHandler {
  constructor() {
    super("choosing");
    this._crateReady = false;
  }

  onEnter(context) {
    Logger.debug('Entering CHOOSING state');

    // Snapshot scores at the boundary between rounds (used for scoreboard delta animation)
    const users = gameServices.users;
    gameServices.previousScores = {};
    for (const id in users) {
      gameServices.previousScores[id] = users[id].points.victories;
    }

    gameServices.menuSystem.clear();

    const objectCrate = gameServices.objectCrate;

    // On reconnect, the server already holds this round's authoritative chose/placed/loaded
    // state (just hydrated) — resetting it here would unselect the player's character and
    // crate choice on the server. Only reset for a genuine new round.
    const isReconnect = !!context.context?.reconnect;
    if (!isReconnect) {
      objectCrate.reset();

      // Reset placeableObject for ALL users (clears stale chose/placed from previous round)
      // Note: users[localId] may be a JSON copy (not same object as gameServices.user) after
      // onUserConnect overwrites it, so we reset gameServices.user explicitly too.
      const user = gameServices.user;
      user.placeableObject.chose = false;
      user.placeableObject.placed = false;
      user.placeableObject.crateIndex = undefined;
      user.placeableObject.rotation = 0;
      user.placeableObject.objectId = undefined;
      user.placeableObject.placementId = undefined;
      user.placeableObject.hasExplosion = false;

      for (let id in users) {
        if (users[id].id !== user.id) {
          users[id].placeableObject.chose = false;
          users[id].placeableObject.placed = false;
          users[id].placeableObject.crateIndex = undefined;
          users[id].placeableObject.rotation = 0;
          users[id].placeableObject.objectId = undefined;
          users[id].placeableObject.placementId = undefined;
          users[id].placeableObject.hasExplosion = false;
        }
        if (users[id].remotePlayer) { users[id].remotePlayer.loaded = false; }
        if (users[id].cursor) { users[id].cursor.loaded = true; }
      }

      // Reset finished/dead before re-announcing — prevents the server from
      // treating the previous round's finished state as a new finish event
      const player = gameServices.player;
      player.finished = false;
      player.dead = false;
      player.loaded = false;

      // Re-announce local player's current character state so all peers
      // can re-load the remote player after the reset above
      gameServices.socketHandler.sendUpdatePlayer();
    }

    gameServices.cameraSystem.zoomToKey({ zoom: gameServices.cameraSystem.getOverviewZoom(), key: "middle" });

    gameServices.inputSystem.resetMouseListeners();

    this._crateReady = false;
    gameServices.matchStateMachine.startTimer("crate_open", GameConfig.states.choosing.crateOpenDelay);
    gameServices.animationSystem.updatePlacedObjects("default");
  }

  onExit(context) {
    Logger.debug('Exiting CHOOSING state');
    gameServices.matchStateMachine.resetTimer("crate_open");
  }

  update() {
    const msm = gameServices.matchStateMachine;
    msm.updateTimer("crate_open");
    if (!this._crateReady && msm.isTimerComplete("crate_open")) {
      this._crateReady = true;
    }

    if (!this._crateReady) { return; }

    const objectCrate = gameServices.objectCrate;
    objectCrate.update();
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].updateInChoosing();
    }
  }

  render() {}

  renderOverlay() {
    if (!this._crateReady) { return; }

    const objectCrate = gameServices.objectCrate;
    objectCrate.render();
    for (let i in objectCrate.objects) {
      objectCrate.objects[i].renderInChoosing();
    }
  }

}
