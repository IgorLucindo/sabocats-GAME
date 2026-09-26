// GameState - Single source of truth for all game state

export class GameState {
  constructor() {
    this.state = this._initialState();
  }

  _initialState() {
    // Structure only — no hardcoded default values here. Defaults live in config.json.
    return {
      environment: {
        isTouch: false,
        isLandscape: false
      },
      game: {
        showDebugMenu: false
      },
      user: {
        id: undefined,
        sessionId: undefined,
        connected: false,
        loginOrder: undefined,
        name: '',
        vote: null,
        localPlayer: {
          id: undefined,
          loaded: false,
          finished: false,
          dead: false
        },
        characterOption: {
          id: undefined
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
        spawnArea: undefined,
        activeName: undefined
      },
      match: {
        seed: undefined,
        currentState: 'lobby',
        placedObjectsHistory: [],
        spawnSeed: [],
        crateSeed: []
      },
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

  hydrateSessionId(stored = {}) {
    const sessionId = typeof stored.sessionId === 'string' && /^[A-Za-z0-9]{16}$/.test(stored.sessionId)
      ? stored.sessionId
      : this._generateSessionId();
    this.set('user.sessionId', sessionId);
    this._saveLocalData(stored.settings ?? this.get('settings'), stored.name ?? this.get('user.name'), sessionId);
    return sessionId;
  }

  _generateSessionId() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(values);
    } else {
      for (let i = 0; i < values.length; i++) values[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(values, value => alphabet[value % alphabet.length]).join('');
  }

  _saveLocalData(settings, name, sessionId = this.get('user.sessionId')) {
    try {
      localStorage.setItem('sabocats_settings', JSON.stringify({ settings, name, sessionId }));
    } catch {}
  }

  saveSettings() {
    this._saveLocalData(this.get('settings'), this.get('user.name'));
  }
}

// Create singleton instance
export const gameState = new GameState();
