// Game Initializer - Orchestrates game initialization sequence

import { gameServices } from './GameServices.js';

export class GameInitializer {
  constructor() {}

  // Main initialization method - call this instead of manual setup
  initialize() {
    console.log('🎮 Initializing game...');

    // Step 1: Setup DOM and rendering
    console.log('  📺 Setting up canvas...');
    gameServices.setupCanvas('.canvas');
    gameServices.setupUI('divMenu');

    // Step 2: Create core game objects
    console.log('  🎮 Setting up match...');
    gameServices.setupMatch();

    console.log('  🎰 Setting up state machine...');
    gameServices.setupMatchStateMachine();

    console.log('  ⚙️  Setting up game systems...');
    gameServices.setupSystems();

    // Step 3: Load initial map
    console.log('  🗺️  Loading lobby map...');
    gameServices.loadInitialMap('lobby');

    // Step 4: Setup game entities
    console.log('  🐱 Setting up character options...');
    gameServices.setupCharacterOptions();

    console.log('  📦 Setting up game objects...');
    gameServices.setupGameObjects();

    console.log('  👥 Setting up user data...');
    gameServices.setupUserData();

    // Step 5: Initialize handlers
    console.log('  ⌨️  Initializing input...');
    gameServices.initializeInput();

    console.log('  🌐 Initializing network...');
    gameServices.initializeNetwork();

    console.log('✅ Game initialization complete!');
  }
}
