// Game Services - Centralized service locator and dependency management

class GameServices {
  static instance = null;

  constructor() {
    // Core systems (created first)
    this.gameConfig = GameConfig;
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.inputManager = inputManager;
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
    this.camera = new Camera();
    return this;
  }

  // Initialize match
  setupMatch() {
    this.match = new Match();
    return this;
  }

  // Initialize match state machine
  setupMatchStateMachine() {
    // Create all state handlers
    const handlers = {
      "choosing": new ChoosingStateHandler(),
      "placing": new PlacingStateHandler(),
      "playing": new PlayingStateHandler(),
      "scoreboard": new ScoreboardStateHandler()
    };

    // Initialize the singleton with handlers and event bus
    matchStateMachine.initialize(handlers, this.eventBus);

    // Store reference for use elsewhere if needed
    this.matchStateMachine = matchStateMachine;

    return this;
  }

  // Initialize mouse
  setupMouse() {
    this.mouse = new Mouse();
    this.inputManager.mouse = this.mouse;
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
    this.inputManager.initialize();
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

      // Input state (from InputManager)
      keys: this.inputManager.keys,
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
      inputManager: this.inputManager,
      socketHandler: this.socketHandler,
      gameConfig: this.gameConfig,
      entityFactory: this.entityFactory,
      mapFactory: this.mapFactory,
      matchStateMachine: this.matchStateMachine,
      gameServices: this
    };
  }
}

// Create singleton instance
const gameServices = GameServices.getInstance();
