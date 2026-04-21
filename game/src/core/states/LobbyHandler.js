import { StateHandler } from './StateHandler.js';
import { gameServices } from '../GameServices.js';

export class LobbyStateHandler extends StateHandler {
  constructor() { super('lobby'); }

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
