// Event Bus - Pub/Sub system for decoupled communication

export class EventBus {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  // Subscribe to event and auto-unsubscribe after first trigger
  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (...args) => {
      callback(...args);
      unsubscribe();
    });

    return unsubscribe;
  }

  // Emit an event
  emit(eventName, data) {
    if (!this.events[eventName]) {
      return;
    }

    this.events[eventName].forEach(callback => {
      callback(data);
    });
  }

  // Unsubscribe from an event
  off(eventName, callback) {
    if (!this.events[eventName]) {
      return;
    }

    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }

  // Clear all subscribers for an event
  clear(eventName) {
    if (eventName) {
      this.events[eventName] = [];
    } else {
      this.events = {};
    }
  }

  // Get number of subscribers for an event (useful for debugging)
  listenerCount(eventName) {
    return this.events[eventName] ? this.events[eventName].length : 0;
  }
}

// Create singleton instance
export const eventBus = new EventBus();

// Event types documentation
const EventTypes = {
  // Game lifecycle
  'game:start': 'Game has started',
  'game:update': 'Game update tick',
  'game:render': 'Game render tick',
  'game:pause': 'Game paused',
  'game:resume': 'Game resumed',

  // Match events
  'match:start': 'Match started',
  'match:stateChange': 'Match state changed',
  'match:end': 'Match ended',
  'match:join': 'Player joined match',

  // Player events
  'player:spawn': 'Player spawned',
  'player:jump': 'Player jumped',
  'player:land': 'Player landed',
  'player:dead': 'Player died',
  'player:move': 'Player moved',
  'player:finish': 'Player finished level',

  // Input events
  'input:keyDown': 'Key pressed down',
  'input:keyUp': 'Key released',
  'input:mouseMove': 'Mouse moved',
  'input:mouseDown': 'Mouse button pressed',
  'input:mouseUp': 'Mouse button released',

  // Network events
  'network:connected': 'Connected to server',
  'network:disconnected': 'Disconnected from server',
  'network:userConnected': 'Another user connected',
  'network:userDisconnected': 'Another user disconnected',
  'network:userUpdate': 'User data updated',

  // Map events
  'map:load': 'Map loaded',
  'map:unload': 'Map unloaded',
  'map:change': 'Map changed',

  // UI events
  'ui:menuOpen': 'Menu opened',
  'ui:menuClose': 'Menu closed',
  'ui:scoreboardShow': 'Scoreboard showed',
  'ui:scoreboardHide': 'Scoreboard hidden'
};
