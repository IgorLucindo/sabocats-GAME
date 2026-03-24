// Game Initializer - Orchestrates game initialization sequence

import { gameServices } from './GameServices.js';
import { Logger } from './Logger.js';

export class GameInitializer {
  constructor() {}

  // Main initialization method - call this instead of manual setup
  initialize() {
    Logger.info('🎮 Initializing game...');

    // Step 1: Setup DOM and rendering
    Logger.info('📺 Setting up canvas...');
    gameServices.setupCanvas('.canvas');
    gameServices.setupUI('divMenu');

    // Step 2: Create core game objects
    Logger.info('🎮 Setting up match...');
    gameServices.setupMatch();

    Logger.info('🎰 Setting up state machine...');
    gameServices.setupMatchStateMachine();

    Logger.info('⚙️  Setting up game systems...');
    gameServices.setupSystems();

    // Step 3: Load initial map
    Logger.info('🗺️  Loading lobby map...');
    gameServices.loadInitialMap('lobby');

    // Step 4: Setup game entities
    Logger.info('🐱 Setting up character options...');
    gameServices.setupCharacterOptions();

    Logger.info('📦 Setting up game objects...');
    gameServices.setupGameObjects();

    Logger.info('👥 Setting up user data...');
    gameServices.setupUserData();

    // Step 5: Initialize handlers
    Logger.info('⌨️  Initializing input...');
    gameServices.initializeInput();

    Logger.info('🌐 Initializing network...');
    gameServices.initializeNetwork();

    Logger.info('✅ Game initialization complete!');
  }
}
