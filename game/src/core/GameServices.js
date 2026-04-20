// Game Services - Centralized service locator and dependency management

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { EntityFactory } from './EntityFactory.js';
import { SystemManager } from '../systems/SystemManager.js';
import { InputSystem } from '../systems/InputSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerControlSystem } from '../systems/PlayerControlSystem.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { MapSystem } from '../systems/MapSystem.js';
import { MenuSystem } from '../systems/MenuSystem.js';
import { CursorSystem } from '../systems/CursorSystem.js';
import { SpectatorSystem } from '../systems/SpectatorSystem.js';
import { SocketHandler } from '../network/SocketHandler.js';
import { ObjectCrate } from '../entities/objects/ObjectCrate.js';
import { InitialStateHandler } from './states/InitialHandler.js';
import { ChoosingStateHandler } from './states/ChoosingHandler.js';
import { PlacingStateHandler } from './states/PlacingHandler.js';
import { PlayingStateHandler } from './states/PlayingHandler.js';
import { ScoreboardStateHandler } from './states/ScoreboardHandler.js';
import { MatchStateMachine } from './MatchStateMachine.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { setRenderContext } from './renderContext.js';

class GameServices {
  constructor(GameConfig, data) {
    this.gameConfig = GameConfig;
    this.data = data;
    this.gameState = gameState;
    this.eventBus = eventBus;

    // Game objects (created during initialization)
    this.canvas = null;
    this.ctx = null;
    this.inMatch = false;
    this.matchObjects = [];
    this.previousScores = {};
    this.cursorSystem = null;

    // Map data
    this.background = null;
    this.grid = null;
    this.spawnArea = null;

    // Game objects
    this.objectCrate = null;
    this.characterOptions = [];
    this.player = null;
    this.placeableObjects = [];
    this.users = {};

    // UI
    this.divMenu = null;
  }

  // Set up canvas
  setupCanvas(canvasSelector) {
    this.canvas = document.querySelector(canvasSelector);
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this._resizeCanvas();

    setRenderContext(this.canvas, this.ctx, this.gameConfig.debug.enabled);

    // Handle window resize
    window.addEventListener('resize', () => this._resizeCanvas());

    return this;
  }

  _resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
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
    this.socketHandler.sendJoinMatch();
  }

  // Start match (transition to initial intro state)
  startMatch() {
    this.inMatch = true;
    this.menuSystem.hideLobbyHint();
    this.matchStateMachine.setState("initial");
  }

  // Initialize match state machine
  setupMatchStateMachine() {
    const handlers = {
      "initial":    new InitialStateHandler(),
      "choosing":   new ChoosingStateHandler(),
      "placing":    new PlacingStateHandler(),
      "playing":    new PlayingStateHandler(),
      "scoreboard": new ScoreboardStateHandler()
    };

    this.matchStateMachine = new MatchStateMachine(handlers, this.eventBus);

    return this;
  }

  // Initialize all game systems
  setupSystems() {
    this.systemManager  = new SystemManager();
    this.inputSystem    = new InputSystem(this.eventBus, this.canvas);
    this.socketHandler  = new SocketHandler(this.eventBus);
    this.entityFactory  = new EntityFactory({ gameConfig: this.gameConfig, data: this.data });

    // Menu system — UI/overlay; registered first, no game-loop dependencies
    this.menuSystem = new MenuSystem({ canvas: this.canvas, divMenu: this.divMenu });
    this.systemManager.register('menuSystem', this.menuSystem, 5);

    // Input
    this.systemManager.register('inputSystem', this.inputSystem, 10);

    // Physics utility (used by Player.update())
    this.physicsSystem = new PhysicsSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('physicsSystem', this.physicsSystem, 20);

    // Player control utility (used by Player.update())
    this.playerControlSystem = new PlayerControlSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('playerControlSystem', this.playerControlSystem, 25);

    // Collision
    this.collisionSystem = new CollisionSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('collisionSystem', this.collisionSystem, 30);

    // Interaction
    this.interactionSystem = new InteractionSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('interactionSystem', this.interactionSystem, 60);

    // Particles
    this.particleSystem = new ParticleSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('particleSystem', this.particleSystem, 70);

    // Spectator — must update before camera so follow targets are set each frame
    this.spectatorSystem = new SpectatorSystem();
    this.systemManager.register('spectatorSystem', this.spectatorSystem, 75);

    // Camera
    this.cameraSystem = new CameraSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('cameraSystem', this.cameraSystem, 80);

    // Animation utility (used by Player.update())
    this.animationSystem = new AnimationSystem({ gameConfig: this.gameConfig });
    this.systemManager.register('animationSystem', this.animationSystem, 85);

    // Cursor — must update after camera so it uses current camera position
    this.cursorSystem = new CursorSystem({ gameConfig: this.gameConfig, eventBus: this.eventBus });
    this.systemManager.register('cursorSystem', this.cursorSystem, 95);

    // Map — created after collision/interaction so they can be passed directly
    this.mapSystem = new MapSystem({
      gameConfig:        this.gameConfig,
      collisionSystem:   this.collisionSystem,
      interactionSystem: this.interactionSystem
    });
    this.systemManager.register('mapSystem', this.mapSystem, 97);

    // Sound
    this.soundSystem = new SoundSystem(this.data.sounds);
    this.systemManager.register('soundSystem', this.soundSystem, 98);

    this.systemManager.initializeAll();

    return this;
  }

  // Load initial map
  loadInitialMap(mapName = 'lobby') {
    const mapCtx = {
      properties: this.gameConfig.rendering,
      get menuSystem() { return gameServices.menuSystem; },
      get player() { return gameServices.player; },
      sendFinishedPlayerToServer: () => this.socketHandler.sendUpdatePlayer(),
    };
    this.mapSystem.loadMap(mapName, mapCtx);

    this.background  = this.mapSystem.background;
    this.grid        = this.mapSystem.grid;
    this.spawnArea   = this.mapSystem.spawnArea;

    return this;
  }

  // Initialize character options
  setupCharacterOptions() {
    this.characterOptions = this.entityFactory.createCharacterOptions();
    this.gameState.set('characterOptions', this.characterOptions);
    return this;
  }

  // Initialize game objects
  setupGameObjects() {
    this.objectCrate = new ObjectCrate({ totalObjects: this.gameConfig.room.maxPlayers });
    this.placeableObjects = [];
    return this;
  }

  // Initialize player
  setupPlayer() {
    this.player = this.entityFactory.createPlayer();
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
}

export let gameServices = null;
export function initGameServices(GameConfig, data) {
  gameServices = new GameServices(GameConfig, data);
  return gameServices;
}
