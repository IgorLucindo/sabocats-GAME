import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';

export class LobbyStateHandler extends StateHandler {
  constructor() { super('lobby'); }

  onEnter(context) {
    const prevState = context?.previousState;
    if (!prevState || prevState !== 'scoreboard') return;

    // Returning from a match — reset and reload lobby
    const player = gameServices.player;
    const users  = gameServices.users;
    const user   = gameServices.user;

    // Local player: keep loaded at characterOption position if already has one
    if (player.characterOption) {
      player._reset();
      player.position.x = player.characterOption.initialPosition.x;
      player.position.y = player.characterOption.initialPosition.y;
    } else {
      player.finished = false;
      player.dead     = false;
      player.loaded   = false;
    }

    user.placeableObject.chose      = false;
    user.placeableObject.placed     = false;
    user.placeableObject.crateIndex = undefined;
    user.placeableObject.rotation   = 0;

    for (const id in users) {
      if (users[id].id !== user.id) {
        users[id].placeableObject.chose      = false;
        users[id].placeableObject.placed     = false;
        users[id].placeableObject.crateIndex = undefined;
        users[id].placeableObject.rotation   = 0;
      }
      if (id !== user.id) {
        const remotePlayer = users[id].remotePlayer;
        if (remotePlayer?.loaded) {
          // Keep loaded, reset match state, reposition at characterOption spot
          remotePlayer.finished = false;
          remotePlayer.dead     = false;
          const charOption = gameServices.characterOptions.find(opt => opt.id === remotePlayer.characterId);
          if (charOption) {
            remotePlayer.position.x = charOption.initialPosition.x;
            remotePlayer.position.y = charOption.initialPosition.y;
          }
          if (users[id].cursor) { users[id].cursor.loaded = false; }
        } else {
          if (remotePlayer) { remotePlayer.loaded = false; }
          if (users[id].cursor) { users[id].cursor.loaded = true; }
        }
      }
    }

    gameServices.menuSystem.clear();
    gameServices.socketHandler.sendUpdatePlayer();
    gameServices.loadInitialMap('lobby');
    gameServices.menuSystem.showLobbyHint();
    if (!player.loaded) { gameServices.cursorSystem.showCursor(); }
  }

  update() {
    const characterOptions = gameServices.characterOptions;
    for (let i in characterOptions) {
      if (!characterOptions[i].selected) { characterOptions[i].update(); }
    }
  }

  render() {
    const characterOptions = gameServices.characterOptions;
    for (let i in characterOptions) {
      if (!characterOptions[i].selected) { characterOptions[i].render(); }
    }
  }
}
