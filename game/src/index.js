// Shorthand for config (for backward compatibility with rest of code)
var properties = GameConfig.rendering;
var debugMode = GameConfig.debug.enabled;

// Initialize game - this sets up all services and objects
function initializeGame() {
  try {
    // Run initialization and expose all globals
    const globals = gameInitializer.initialize();

    // Copy all services/objects to global scope for backward compatibility
    // This allows the rest of the codebase to work without changes
    Object.assign(window, globals);

    // Start the game loop
    gameLoop();

    // Correct deltaTime depending on inactive time
    correctDeltaTimeOnInactiveTime();

    // Set up interval for sending player data to server
    setInterval(() => {
      if(user.connected){sendPlayerAndCursorPositionToServer();}
    }, GameConfig.network.playerUpdateInterval);
  } catch (error) {
    console.error('❌ Game initialization failed:', error);
  }
}

// Start initialization
initializeGame();

