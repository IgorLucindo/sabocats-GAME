// Game Services - Centralized service locator and dependency management

class GameServices {
  static instance = null;

  constructor() {
    // Core systems (created first)
    this.gameConfig = GameConfig;
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.inputSystem = inputSystem;
    this.socketHandler = socketHandler;

    // Game objects (created during initialization)
    this.canvas = null;
    this.ctx = null;
    this.inMatch = false;
    this.matchObjects = [];
    this.cursorSystem = null;

    // Map data
    this.background = null;
    this.staticBackground = null;
    this.grid = null;
    this.startArea = null;
    this.finishArea = null;

    // Game objects
    this.objectCrate = null;
    this.characterOptions = [];
    this.player = null;
    this.placeableObjects = [];
    this.users = {};

    // UI
    this.divMenu = null;
    this.scaledCanvas = null;
  }

  // Get singleton instance
  static getInstance() {
    if (!GameServices.instance) {
      GameServices.instance = new GameServices();
    }
    return GameServices.instance;
  }

  // Set up canvas
  setupCanvas(canvasSelector) {
    this.canvas = document.querySelector(canvasSelector);
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.gameState.set('canvas.width', this.canvas.width);
    this.gameState.set('canvas.height', this.canvas.height);

    this.scaledCanvas = { width: this.canvas.width, height: this.canvas.height };

    return this;
  }

  // Set up UI containers
  setupUI(menuSelector) {
    this.divMenu = document.getElementById(menuSelector);
    return this;
  }

  // Initialize match
  setupMatch() {
    this.inMatch = false;
    this.matchObjects = [];
    return this;
  }

  // Join match (trigger map selection and matching)
  joinMatch() {
    this.mapSystem.resetProperties();
    sendJoinMatchToServer();
  }

  // Start match (transition to choosing state)
  startMatch() {
    this.inMatch = true;
    this.matchStateMachine.setState("choosing");
  }

  // Get current match state from state machine
  getMatchState() {
    return this.matchStateMachine ? this.matchStateMachine.getState() : null;
  }

  // Initialize match state machine
  setupMatchStateMachine() {
    // Use existing singleton instances of state handlers
    const handlers = {
      "choosing": choosingStateHandler,
      "placing": placingStateHandler,
      "playing": playingStateHandler,
      "scoreboard": scoreboardStateHandler
    };

    // Initialize the singleton with handlers and event bus
    matchStateMachine.initialize(handlers, this.eventBus);

    // Store reference for use elsewhere if needed
    this.matchStateMachine = matchStateMachine;

    return this;
  }

  // Initialize all game systems
  setupSystems() {
    // Create system manager
    systemManager = new SystemManager();

    // Menu system — UI/overlay; registered first, no game-loop dependencies
    this.menuSystem = new MenuSystem({ canvas: this.canvas, divMenu: this.divMenu });
    systemManager.register('menuSystem', this.menuSystem, 5);

    // Create and register systems with priority
    // Priority: lower = updates first
    // Tier 1: Foundation systems (input first)
    // InputSystem is a system (has initialize/update/shutdown/query)
    systemManager.register('inputSystem', this.inputSystem, 10);

    // Physics must come after input but before collision
    this.physicsSystem = new PhysicsSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('physicsSystem', this.physicsSystem, 20);

    // Collision system uses physics results
    this.collisionSystem = new CollisionSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('collisionSystem', this.collisionSystem, 30);

    // Player control uses all foundation systems
    this.playerControlSystem = new PlayerControlSystem({
      inputSystem: this.inputSystem,
      physicsSystem: this.physicsSystem,
      collisionSystem: this.collisionSystem,
      gameConfig: this.gameConfig
    });
    systemManager.register('playerControlSystem', this.playerControlSystem, 40);

    // Tier 2: Gameplay systems
    // Animation system for sprite updates
    this.animationSystem = new AnimationSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('animationSystem', this.animationSystem, 50);

    // Interaction system for entity-area collisions
    this.interactionSystem = new InteractionSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('interactionSystem', this.interactionSystem, 60);

    // Particle system for effect management
    this.particleSystem = new ParticleSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('particleSystem', this.particleSystem, 70);

    // Tier 3: Presentation systems
    // Camera system for camera control
    this.cameraSystem = new CameraSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('cameraSystem', this.cameraSystem, 80);

    // Render layer system for render ordering
    this.renderLayerSystem = new RenderLayerSystem({
      gameConfig: this.gameConfig
    });
    systemManager.register('renderLayerSystem', this.renderLayerSystem, 90);

    // Cursor system - must update after camera so it uses current camera position
    this.cursorSystem = new CursorSystem({ gameConfig: this.gameConfig, eventBus: this.eventBus });
    systemManager.register('cursorSystem', this.cursorSystem, 95);

    // Map system — created after collision/interaction so they can be passed directly
    this.mapSystem = new MapSystem({
      gameConfig:        this.gameConfig,
      collisionSystem:   this.collisionSystem,
      interactionSystem: this.interactionSystem
    });
    systemManager.register('mapSystem', this.mapSystem, 97);

    systemManager.initializeAll();

    return this;
  }

  // Load initial map
  loadInitialMap(mapName = 'lobby') {
    this.mapSystem.loadMap(mapName);

    this.background       = this.mapSystem.background;
    this.staticBackground = this.mapSystem.staticBackground;
    this.grid             = this.mapSystem.grid;
    this.startArea        = this.mapSystem.startArea;

    return this;
  }

  // Initialize character options
  setupCharacterOptions() {
    this.characterOptions = entityFactory.createCharacterOptions();

    this.gameState.set('objects.characterOptions', this.characterOptions);
    return this;
  }

  // Initialize game objects
  setupGameObjects() {
    this.objectCrate = new ObjectCrate({ totalObjects: 4 });
    this.player = { position: { x: 0, y: 0 }, currentSprite: undefined, loaded: false };
    this.placeableObjects = [];

    // Store reference to entityFactory for use elsewhere if needed
    this.entityFactory = entityFactory;

    this.gameState.set('objects.placeableObjects', this.placeableObjects);

    return this;
  }

  // Initialize user data
  setupUserData() {
    this.users = this.gameState.get('users');
    this.user = this.gameState.get('user');
    return this;
  }

  // Initialize input handling
  initializeInput() {
    this.inputSystem.initialize();
    return this;
  }

  // Initialize network
  initializeNetwork() {
    this.socketHandler.initialize();
    return this;
  }

  // Get references to make them global (for backward compatibility)
  exposeGlobals() {
    return {
      // Canvas and rendering
      canvas: this.canvas,
      ctx: this.ctx,
      scaledCanvas: this.scaledCanvas,
      divMenu: this.divMenu,

      // Core game objects
      matchObjects: this.matchObjects,
      objectCrate: this.objectCrate,
      player: this.player,

      // Map data
      background: this.background,
      staticBackground: this.staticBackground,
      grid: this.grid,
      startArea: this.startArea,
      finishArea: this.finishArea,

      // Game entities
      characterOptions: this.characterOptions,
      placeableObjects: this.placeableObjects,
      users: this.users,
      user: this.user,

      // Input state (from InputSystem)
      keys: this.inputSystem.keys,
      choseMaps: this.gameState.get('choseMaps'),

      // Time (initial value; GameLoop updates deltaTime each tick)
      deltaTime: 0,

      // Systems
      gameState: this.gameState,
      eventBus: this.eventBus,
      inputSystem: this.inputSystem,
      menuSystem: this.menuSystem,
      cursorSystem: this.cursorSystem,
      socketHandler: this.socketHandler,
      gameConfig: this.gameConfig,
      entityFactory: this.entityFactory,
      mapSystem: this.mapSystem,
      matchStateMachine: this.matchStateMachine,
      systemManager: this.systemManager,
      physicsSystem: this.physicsSystem,
      collisionSystem: this.collisionSystem,
      playerControlSystem: this.playerControlSystem,
      animationSystem: this.animationSystem,
      interactionSystem: this.interactionSystem,
      particleSystem: this.particleSystem,
      cameraSystem: this.cameraSystem,
      renderLayerSystem: this.renderLayerSystem,
      gameServices: this
    };
  }
}

// Create singleton instance
const gameServices = GameServices.getInstance();
