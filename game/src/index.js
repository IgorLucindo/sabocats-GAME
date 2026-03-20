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
      // Data files
      await this.load(this.dataUrl + 'loadData.js');
      await this.load(this.dataUrl + 'characters/blackCat.js');
      await this.load(this.dataUrl + 'objects/block1x1.js');
      await this.load(this.dataUrl + 'objects/block1x2.js');
      await this.load(this.dataUrl + 'objects/movingSaw.js');
      await this.load(this.dataUrl + 'objects/spikeBall.js');
      await this.load(this.dataUrl + 'objects/spikes1x1.js');
      await this.load(this.dataUrl + 'objects/spikes1x2.js');
      await this.load(this.dataUrl + 'auxObjects/saw.js');
      await this.load(this.dataUrl + 'particles/fall.js');
      await this.load(this.dataUrl + 'particles/jump.js');
      await this.load(this.dataUrl + 'particles/turn.js');
      await this.load(this.dataUrl + 'particles/turnLeft.js');
      await this.load(this.dataUrl + 'particles/wallSlideJump.js');
      await this.load(this.dataUrl + 'particles/wallSlideJumpLeft.js');

      // Core systems
      await this.load(this.baseUrl + 'config/GameConfig.js');
      await this.load(this.baseUrl + 'core/gameState.js');
      await this.load(this.baseUrl + 'core/eventBus.js');

      // Input & Network
      await this.load(this.baseUrl + 'systems/InputSystem.js');
      await this.load(this.baseUrl + 'network/SocketHandler.js');

      // Entity creation
      await this.load(this.baseUrl + 'utils/create/EntityFactory.js');

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

      // Service management
      await this.load(this.baseUrl + 'core/GameServices.js');
      await this.load(this.baseUrl + 'core/GameInitializer.js');

      // Classes
      await this.load(this.baseUrl + 'classes/CollisionBlock.js');
      await this.load(this.baseUrl + 'classes/Sprite.js');
      await this.load(this.baseUrl + 'classes/background/Layer.js');
      await this.load(this.baseUrl + 'classes/background/BackgroundLayered.js');
      await this.load(this.baseUrl + 'classes/object/BoxObject.js');
      await this.load(this.baseUrl + 'classes/object/AuxObject.js');
      await this.load(this.baseUrl + 'classes/player/OnlinePlayer.js');
      await this.load(this.baseUrl + 'classes/player/SelectablePlayer.js');
      await this.load(this.baseUrl + 'classes/Box.js');
      await this.load(this.baseUrl + 'classes/Mouse.js');
      await this.load(this.baseUrl + 'classes/InteractableArea.js');

      // Utils
      await this.load(this.baseUrl + 'utils/utils.js');
      await this.load(this.baseUrl + 'utils/mapUtils.js');
      await this.load(this.baseUrl + 'utils/menuUtils.js');
      await this.load(this.baseUrl + 'utils/create/object.js');
      await this.load(this.baseUrl + 'utils/create/player.js');
      await this.load(this.baseUrl + 'utils/create/particle.js');
      await this.load(this.baseUrl + 'utils/create/map/lobby.js');
      await this.load(this.baseUrl + 'utils/create/map/forest.js');

      // Map factory
      await this.load(this.baseUrl + 'utils/create/MapFactory.js');

      // Game loop
      await this.load(this.baseUrl + 'utils/loop/game.js');
      await this.load(this.baseUrl + 'utils/loop/logic.js');
      await this.load(this.baseUrl + 'utils/loop/match.js');
      await this.load(this.baseUrl + 'utils/loop/render.js');
      await this.load(this.baseUrl + 'utils/gameInputs.js');

      // Server communication
      await this.load(this.baseUrl + 'server/sendData/mapData.js');
      await this.load(this.baseUrl + 'server/sendData/objectData.js');
      await this.load(this.baseUrl + 'server/sendData/playerData.js');
      await this.load(this.baseUrl + 'server/sendData/matchData.js');
      await this.load(this.baseUrl + 'server/client.js');

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
    gameLoop();

    // Correct deltaTime on inactive time
    correctDeltaTimeOnInactiveTime();

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

