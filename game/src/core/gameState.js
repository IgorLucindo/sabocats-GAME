// Centralized Game State Manager
// Single source of truth for all game state

class GameStateManager {
  constructor() {
    this.state = {
      // Game lifecycle
      game: {
        inLobby: true,
        noPlayerDied: true,
        debugMode: true
      },

      // Time tracking
      time: {
        accumulated: 0,
        current: 0,
        previous: 0,
        deltaTime: 0,
        frame1: 0,
        time1: 0,
        time2: 0,
        mapVotes: 0
      },

      // Current user data
      user: {
        id: undefined,
        connected: false,
        loginOrder: undefined,
        chooseMap: {
          current: undefined,
          previous: undefined
        },
        boxObject: {
          position: { x: 0, y: 0 },
          boxId: undefined,
          chose: false,
          placed: false
        },
        points: {
          victories: 0
        }
      },

      // Online players
      users: {},

      // Canvas & rendering
      canvas: {
        width: 0,
        height: 0
      },

      // Game objects
      map: {
        background: undefined,
        staticBackground: undefined,
        grid: undefined,
        startArea: undefined,
        finishArea: undefined
      },

      // Collision & interaction
      collision: {
        allCollisionBlocks: [],
        allInteractableAreas: []
      },

      // Game objects
      objects: {
        allParticles: [],
        boxObjects: [],
        selectablePlayers: []
      },

      // Map voting
      choseMaps: {
        forest: { map: 'forest', number: 0, previousNumber: 0 },
        hills: { map: 'hills', number: 0, previousNumber: 0 }
      }
    };

    this.subscribers = {};
  }

  // Get a value from state (deep path support: 'user.id', 'time.deltaTime')
  get(path) {
    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  // Set a value in state (deep path support)
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;

    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Notify subscribers
    this.notify(path, value, oldValue);
  }

  // Subscribe to state changes
  subscribe(path, callback) {
    if (!this.subscribers[path]) {
      this.subscribers[path] = [];
    }
    this.subscribers[path].push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers[path] = this.subscribers[path].filter(cb => cb !== callback);
    };
  }

  // Notify subscribers of state changes
  notify(path, newValue, oldValue) {
    if (this.subscribers[path]) {
      this.subscribers[path].forEach(callback => {
        callback(newValue, oldValue);
      });
    }

    // Also notify parent paths (e.g., 'user' when 'user.id' changes)
    const parentPath = path.substring(0, path.lastIndexOf('.'));
    if (parentPath && this.subscribers[parentPath]) {
      this.subscribers[parentPath].forEach(callback => {
        callback(this.get(parentPath), undefined);
      });
    }
  }

  // Get entire state object (for debugging)
  getState() {
    return this.state;
  }

  // Reset state to initial values
  reset() {
    this.state = {
      game: { inLobby: true, noPlayerDied: true, debugMode: true },
      time: { accumulated: 0, current: 0, previous: 0, deltaTime: 0, frame1: 0, time1: 0, time2: 0, mapVotes: 0 },
      user: {
        id: undefined,
        connected: false,
        loginOrder: undefined,
        chooseMap: { current: undefined, previous: undefined },
        boxObject: { position: { x: 0, y: 0 }, boxId: undefined, chose: false, placed: false },
        points: { victories: 0 }
      },
      users: {},
      canvas: { width: 0, height: 0 },
      map: { background: undefined, staticBackground: undefined, grid: undefined, startArea: undefined, finishArea: undefined },
      collision: { allCollisionBlocks: [], allInteractableAreas: [] },
      objects: { allParticles: [], boxObjects: [], selectablePlayers: [] },
      choseMaps: { forest: { map: 'forest', number: 0, previousNumber: 0 }, hills: { map: 'hills', number: 0, previousNumber: 0 } }
    };
  }
}

// Create singleton instance
const gameState = new GameStateManager();
