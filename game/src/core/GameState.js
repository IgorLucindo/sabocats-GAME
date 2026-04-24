// GameState - Single source of truth for all game state

export class GameState {
  constructor() {
    this.state = this._initialState();
  }

  _initialState() {
    // Structure only — no hardcoded default values here. Defaults live in config.json.
    return {
      game: {
        showDebugMenu: false
      },
      time: {
        mapVotes: 0
      },
      user: {
        id: undefined,
        connected: false,
        loginOrder: undefined,
        name: '',
        localPlayer: {
          id: undefined,
          loaded: false,
          finished: false,
          dead: false
        },
        characterOption: {
          id: undefined
        },
        chooseMap: {
          current: undefined,
          previous: undefined
        },
        placeableObject: {
          crateIndex: undefined,
          position: { x: 0, y: 0 },
          chose: false,
          placed: false,
          rotation: 0
        },
        points: {
          victories: 0
        }
      },
      users: {},
      characterOptions: [],
      map: {
        spawnArea: undefined
      },
      match: {
        seed: undefined,
        spawnSeed: [],
        crateSeed: []
      },
      choseMaps: {},
      room: {
        id: undefined,
        hostId: undefined,
        matchSettings: {
          pointsToWin: 0,
          lives: 0,
          enabledObjects: {}
        },
        winnerId: undefined
      },
      settings: {}
    };
  }

  // Get a value from state (deep path support: 'user.id', 'time.mapVotes')
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

  // Set a value in state (deep path support).
  // Throws if the path is not defined in _initialState() — _initialState() is the schema.
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;

    for (const key of keys) {
      if (!(key in target)) throw new Error(`GameState.set: unknown path "${path}"`);
      target = target[key];
    }

    if (!(lastKey in target)) throw new Error(`GameState.set: unknown path "${path}"`);
    target[lastKey] = value;
  }

  saveSettings() {
    try { localStorage.setItem('sabocats_settings', JSON.stringify({ settings: this.state.settings, name: this.state.user.name })); } catch {}
  }
}

// Create singleton instance
export const gameState = new GameState();
