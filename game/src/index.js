// Script loader - loads all game scripts in dependency order
class ScriptLoader {
  constructor() {
    this.baseUrl = 'src/';
    this.dataUrl = '../data/';
    this.loadedScripts = new Set();
  }

  async load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async loadAll() {
    try {
      // Load DataLoader, then fetch config + all game data JSON in parallel
      await this.load(this.baseUrl + 'core/DataLoader.js');
      await dataLoader.load();

      // Map descriptors stay as JS (contain function callbacks)
      await this.load(this.dataUrl + 'maps/lobby.js');
      await this.load(this.dataUrl + 'maps/forest.js');

      // Core systems (GameConfig already set by DataLoader)
      await this.load(this.baseUrl + 'core/gameState.js');
      await this.load(this.baseUrl + 'core/eventBus.js');

      // Input & Network
      await this.load(this.baseUrl + 'systems/InputSystem.js');
      await this.load(this.baseUrl + 'network/SocketHandler.js');

      // Entity creation
      await this.load(this.baseUrl + 'core/EntityFactory.js');

      // Base classes (needed by systems)
      await this.load(this.baseUrl + 'entities/Sprite.js');

      // State management
      await this.load(this.baseUrl + 'core/StateHandler.js');
      await this.load(this.baseUrl + 'core/MatchStateMachine.js');
      await this.load(this.baseUrl + 'core/states/ChoosingHandler.js');
      await this.load(this.baseUrl + 'core/states/PlacingHandler.js');
      await this.load(this.baseUrl + 'core/states/PlayingHandler.js');
      await this.load(this.baseUrl + 'core/states/ScoreboardHandler.js');

      // Game systems
      await this.load(this.baseUrl + 'systems/SystemManager.js');
      await this.load(this.baseUrl + 'systems/PhysicsSystem.js');
      await this.load(this.baseUrl + 'systems/CollisionSystem.js');
      await this.load(this.baseUrl + 'systems/PlayerControlSystem.js');
      await this.load(this.baseUrl + 'systems/AnimationSystem.js');
      await this.load(this.baseUrl + 'systems/InteractionSystem.js');
      await this.load(this.baseUrl + 'systems/ParticleSystem.js');
      await this.load(this.baseUrl + 'systems/RenderLayerSystem.js');
      await this.load(this.baseUrl + 'systems/CameraSystem.js');
      await this.load(this.baseUrl + 'systems/MapSystem.js');
      await this.load(this.baseUrl + 'systems/MenuSystem.js');

      // Service management
      await this.load(this.baseUrl + 'core/GameServices.js');
      await this.load(this.baseUrl + 'core/GameInitializer.js');

      // Entities
      await this.load(this.baseUrl + 'entities/Background.js');
      await this.load(this.baseUrl + 'entities/objects/PlaceableObject.js');
      await this.load(this.baseUrl + 'entities/objects/ObjectAttachment.js');
      await this.load(this.baseUrl + 'entities/characters/Player.js');
      await this.load(this.baseUrl + 'entities/characters/RemotePlayer.js');
      await this.load(this.baseUrl + 'entities/characters/CharacterOption.js');
      await this.load(this.baseUrl + 'entities/objects/ObjectCrate.js');
      await this.load(this.baseUrl + 'systems/CursorSystem.js');

      // Utils
      await this.load(this.baseUrl + 'helpers.js');

      // Game loop
      await this.load(this.baseUrl + 'core/GameLoop.js');

      // Server communication
      await this.load(this.baseUrl + 'server/sendData/mapData.js');
      await this.load(this.baseUrl + 'server/sendData/objectData.js');
      await this.load(this.baseUrl + 'server/sendData/playerData.js');
      await this.load(this.baseUrl + 'server/sendData/matchData.js');

      console.log('✅ All scripts loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load scripts:', error);
      throw error;
    }
  }
}

// Shorthand for config (for backward compatibility)
// These will be set after GameConfig is loaded
var properties;
var debugMode;

// Initialize game
function initializeGame() {
  try {
    // Set up shorthand variables after GameConfig is loaded
    properties = GameConfig.rendering;
    debugMode = GameConfig.debug.enabled;

    const globals = gameInitializer.initialize();
    Object.assign(window, globals);

    // Start the game loop
    gameLoop.start();

    // Set up interval for sending player data to server
    setInterval(() => {
      if (user.connected) { sendPlayerAndCursorPositionToServer(); }
    }, GameConfig.network.playerUpdateInterval);
  } catch (error) {
    console.error('❌ Game initialization failed:', error);
  }
}

// Load all scripts then start game
const loader = new ScriptLoader();
loader.loadAll().then(() => initializeGame()).catch(err => {
  console.error('Fatal error during script loading:', err);
});

