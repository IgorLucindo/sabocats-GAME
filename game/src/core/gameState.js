// GameState - Single source of truth for all game state

export class GameState {
  constructor() {
    this.state = this._initialState();
  }

  _initialState() {
    return {
      game: {
        inLobby: true,
        noPlayerDied: true,
        debugMode: true
      },
      time: {
        mapVotes: 0
      },
      user: {
        id: undefined,
        connected: false,
        loginOrder: undefined,
        chooseMap: {
          current: undefined,
          previous: undefined
        },
        placeableObject: {
          position: { x: 0, y: 0 },
          boxId: undefined,
          chose: false,
          placed: false
        },
        points: {
          victories: 0
        }
      },
      users: {},
      canvas: {
        width: 0,
        height: 0
      },
      map: {
        background: undefined,
        staticBackground: undefined,
        grid: undefined,
        startArea: undefined
      },
      objects: {
        placeableObjects: [],
        characterOptions: []
      },
      choseMaps: {
        forest: { map: 'forest', number: 0, previousNumber: 0 }
      }
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

    target[lastKey] = value;
  }
}

// Create singleton instance
export const gameState = new GameState();
