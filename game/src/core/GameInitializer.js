// Game Initializer - Orchestrates game initialization sequence

import { gameServices } from './GameServices.js';
import { Logger } from './Logger.js';

export class GameInitializer {
  constructor() {}

  initialize() {
    Logger.info('Initializing game...');

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

    gameServices.initializeInput();
    gameServices.initializeNetwork();

    Logger.info('Game initialization complete.');
  }
}
