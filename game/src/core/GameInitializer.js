// Game Initializer - Orchestrates game initialization sequence

class GameInitializer {
  constructor(services) {
    this.services = services;
  }

  // Main initialization method - call this instead of manual setup
  initialize() {
    console.log('🎮 Initializing game...');

    // Step 1: Setup DOM and rendering
    console.log('  📺 Setting up canvas...');
    this.services.setupCanvas('.canvas');
    this.services.setupUI('divMenu');

    // Step 2: Create core game objects
    console.log('  🎮 Setting up match...');
    this.services.setupMatch();

    console.log('  🎰 Setting up state machine...');
    this.services.setupMatchStateMachine();

    console.log('  ⚙️  Setting up game systems...');
    this.services.setupSystems();

    // Step 3: Load initial map
    console.log('  🗺️  Loading lobby map...');
    this.services.loadInitialMap('lobby');

    // Expose map globals BEFORE creating game objects (Box needs them)
    window.background = this.services.background;
    window.staticBackground = this.services.staticBackground;
    window.grid = this.services.grid;

    // Step 4: Setup game entities
    console.log('  🐱 Setting up character options...');
    this.services.setupCharacterOptions();

    console.log('  📦 Setting up game objects...');
    this.services.setupGameObjects();

    console.log('  👥 Setting up user data...');
    this.services.setupUserData();

    // Expose user globals EARLY (before socket initialization)
    window.user = this.services.user;
    window.users = this.services.users;

    // Step 5: Initialize handlers
    console.log('  ⌨️  Initializing input...');
    this.services.initializeInput();

    console.log('  🌐 Initializing network...');
    this.services.initializeNetwork();

    console.log('✅ Game initialization complete!');
    console.log('Exposing services to global scope for backward compatibility...');

    // Expose all globals for backward compatibility
    return this.services.exposeGlobals();
  }
}

// Create initializer instance
const gameInitializer = new GameInitializer(gameServices);

