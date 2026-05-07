// Game Initializer - Orchestrates game initialization sequence

import { gameServices } from './GameServices.js';
import { Logger } from './Logger.js';

export class GameInitializer {
  constructor() {}

  async setup() {
    gameServices.setupEnvironment();
    await gameServices.setupOverlayManager();
  }

  initialize() {
    Logger.info('Initializing game...');

    gameServices.setupLocalState();
    gameServices.setupCanvas('.canvas');
    gameServices.setupUI('divMenu');

    gameServices.setupMatch();
    gameServices.setupMatchStateMachine();
    gameServices.setupSystems();

    gameServices.loadInitialMap('lobby');

    gameServices.setupCharacterOptions();
    gameServices.setupGameObjects();
    gameServices.setupPlayer();
    gameServices.setupUserData();
    gameServices.setupNetwork();

    Logger.info('Game initialization complete.');
  }
}
