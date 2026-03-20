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
    this.camera = null;
    this.match = null;
    this.mouse = null;

    // Map data
    this.background = null;
    this.staticBackground = null;
    this.grid = null;
    this.allCollisionBlocks = [];
    this.allInteractableAreas = [];
    this.startArea = null;
    this.finishArea = null;

    // Game objects
    this.box = null;
    this.selectablePlayers = [];
    this.player = null;
    this.allParticles = [];
    this.boxObjects = [];
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

  // Initialize camera
  setupCamera() {
    // Camera is now handled by CameraSystem
    // This method maintains compatibility with existing code
    // Camera will be set after CameraSystem is created
    this.camera = null;
    return this;
  }

  // Initialize match
  setupMatch() {
    // Match is now handled by MatchStateMachine
    // This method maintains compatibility with existing code
    // Create a simple match object for backward compatibility
    this.match = {
      state: 'idle',
      time: 0,
      players: [],
      map: null,
      isPlaying: false,
      isFinished: false,
      start: function() { this.state = 'playing'; this.isPlaying = true; },
      end: function() { this.state = 'finished'; this.isPlaying = false; this.isFinished = true; },
      reset: function() { 
        this.state = 'idle'; 
        this.time = 0; 
        this.isPlaying = false; 
        this.isFinished = false; 
      }
    };
    return this;
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
      gameConfig: this.gameConfig,
      entityFactory: this.entityFactory
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

    // Initialize all systems
    systemManager.initializeAll();

    return this;
  }

  // Initialize mouse
  setupMouse() {
    this.mouse = new Mouse();
    this.inputSystem.mouse = this.mouse;
    return this;
  }

  // Load initial map
  loadInitialMap(mapName = 'lobby') {
    const mapData = mapFactory.createMap(mapName);

    this.background = mapData.background;
    this.staticBackground = mapData.staticBackground;
    this.grid = mapData.grid;
    this.startArea = mapData.startArea;
    this.allCollisionBlocks = mapData.allCollisionBlocks;
    this.allInteractableAreas = mapData.allInteractableAreas;

    // Store reference to mapFactory for use elsewhere if needed
    this.mapFactory = mapFactory;

    this.gameState.set('map.background', this.background);
    this.gameState.set('map.staticBackground', this.staticBackground);
    this.gameState.set('map.grid', this.grid);
    this.gameState.set('map.startArea', this.startArea);
    this.gameState.set('collision.allCollisionBlocks', this.allCollisionBlocks);
    this.gameState.set('collision.allInteractableAreas', this.allInteractableAreas);

    return this;
  }

  // Initialize selectable players
  setupSelectablePlayers() {
    this.selectablePlayers = entityFactory.createSelectablePlayers();

    this.gameState.set('objects.selectablePlayers', this.selectablePlayers);
    return this;
  }

  // Initialize game objects
  setupGameObjects() {
    this.box = new Box({ totalObjects: 4 });
    this.player = { position: { x: 0, y: 0 }, currentSprite: undefined, loaded: false };
    this.allParticles = [];
    this.boxObjects = [];

    // Store reference to entityFactory for use elsewhere if needed
    this.entityFactory = entityFactory;

    this.gameState.set('objects.allParticles', this.allParticles);
    this.gameState.set('objects.boxObjects', this.boxObjects);

    return this;
  }

  // Initialize user data
  setupUserData() {
    this.users = this.gameState.get('users');
    this.user = this.gameState.get('user');
    return this;
  }

  // Initialize time variables for game loop
  setupTimeVariables() {
    this.accumulatorTime = 0;
    this.currentTime = 0;
    this.previousTime = 0;
    this.deltaTime = 0;
    this.time1 = 0;
    this.time2 = 0;
    this.frame1 = 0;
    this.mapVotes = 0;
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
      camera: this.camera,
      match: this.match,
      mouse: this.mouse,
      box: this.box,
      player: this.player,

      // Map data
      background: this.background,
      staticBackground: this.staticBackground,
      grid: this.grid,
      allCollisionBlocks: this.allCollisionBlocks,
      allInteractableAreas: this.allInteractableAreas,
      startArea: this.startArea,
      finishArea: this.finishArea,

      // Game entities
      selectablePlayers: this.selectablePlayers,
      allParticles: this.allParticles,
      boxObjects: this.boxObjects,
      users: this.users,
      user: this.user,

      // Input state (from InputSystem)
      keys: this.inputSystem.keys,
      choseMaps: this.gameState.get('choseMaps'),

      // Time variables
      accumulatorTime: this.accumulatorTime,
      currentTime: this.currentTime,
      previousTime: this.previousTime,
      deltaTime: this.deltaTime,
      time1: this.time1,
      time2: this.time2,
      frame1: this.frame1,
      mapVotes: this.mapVotes,

      // Systems
      gameState: this.gameState,
      eventBus: this.eventBus,
      inputSystem: this.inputSystem,
      socketHandler: this.socketHandler,
      gameConfig: this.gameConfig,
      entityFactory: this.entityFactory,
      mapFactory: this.mapFactory,
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
