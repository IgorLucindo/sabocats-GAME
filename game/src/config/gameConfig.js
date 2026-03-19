// Game Configuration Constants
// All immutable game values organized by category

const GameConfig = {
  // Debug settings
  debug: {
    enabled: true,
    showHitboxes: false,
    showCamerabox: false
  },

  // Rendering settings
  rendering: {
    pixelScale: 1,
    tileSize: 42,
    tickTime: 1 / 120
  },

  // Physics constants
  physics: {
    gravity: 1,
    maxFallSpeed: 20,
    gravityFallMultiplier: 1.1,
    gravityPeakMultiplier: 0.5,
    peakVelocityThreshold: 4
  },

  // Movement constants - Walking
  movement: {
    walk: {
      acceleration: 0.1,
      maxVelocity: 5
    },
    run: {
      acceleration: 0.3,
      maxVelocity: 8
    },
    deceleration: 0.5,
    peakSpeedMultiplier: 1.08
  },

  // Jump constants
  jump: {
    jumpVelocity: 20,
    jumpBuffer: 0.2,
    coyoteTime: 0.2,
    wallSlideVelocity: 3,
    wallSlideJumpVelocity: 10,
    wallSlideSprintJumpVelocity: 13,
    stopWallSlidingFrames: 20
  },

  // Particle system
  particles: {
    maxParticles: 50
  },

  // Network settings
  network: {
    playerUpdateInterval: 15 // ms
  }
};

// Freeze to prevent accidental mutations
Object.freeze(GameConfig);
Object.freeze(GameConfig.debug);
Object.freeze(GameConfig.rendering);
Object.freeze(GameConfig.physics);
Object.freeze(GameConfig.movement);
Object.freeze(GameConfig.jump);
Object.freeze(GameConfig.particles);
Object.freeze(GameConfig.network);
