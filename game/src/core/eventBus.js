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
