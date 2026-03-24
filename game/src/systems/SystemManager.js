// SystemManager - Orchestrates all game systems

export class SystemManager {
  constructor() {
    this.systems = {};
    this.updateOrder = [];
  }

  /**
   * Register a system with the manager
   * @param {string} name - System name
   * @param {GameSystem} system - System instance
   * @param {number} priority - Update order priority (lower = earlier)
   */
  register(name, system, priority = 100) {
    this.systems[name] = { instance: system, priority };
    this.updateOrder.push({ name, priority });
    this.updateOrder.sort((a, b) => a.priority - b.priority);
    console.log(`  ✓ Registered system: ${name}`);
  }

  /**
   * Initialize all systems in order
   */
  initializeAll() {
    for (let item of this.updateOrder) {
      const system = this.systems[item.name].instance;
      if (system.initialize) {
        system.initialize();
      }
    }
    console.log(`  🎮 Initialized ${this.updateOrder.length} systems`);
  }

  /**
   * Update all systems in registered order
   * @param {...args} - Arguments to pass to system.update()
   */
  updateAll(...args) {
    for (let item of this.updateOrder) {
      const system = this.systems[item.name].instance;
      if (system.update) {
        system.update(...args);
      }
    }
  }

  /**
   * Shutdown all systems in reverse order
   */
  shutdownAll() {
    for (let i = this.updateOrder.length - 1; i >= 0; i--) {
      const item = this.updateOrder[i];
      const system = this.systems[item.name].instance;
      if (system.shutdown) {
        system.shutdown();
      }
    }
    console.log(`  ⛔ Shutdown all systems`);
  }

  /**
   * Query a specific system
   * @param {string} systemName - Name of system to query
   * @param {string} question - Question to ask system
   * @returns {*} - System response
   */
  querySystem(systemName, question) {
    const system = this.systems[systemName];
    if (!system) {
      console.warn(`System not found: ${systemName}`);
      return null;
    }
    if (system.instance.query) {
      return system.instance.query(question);
    }
    return null;
  }

  /**
   * Get a system instance by name
   * @param {string} name - System name
   * @returns {GameSystem} - System instance
   */
  getSystem(name) {
    const system = this.systems[name];
    return system ? system.instance : null;
  }

  /**
   * Check if a system exists
   * @param {string} name - System name
   * @returns {boolean}
   */
  hasSystem(name) {
    return this.systems[name] !== undefined;
  }

  /**
   * Get list of all registered systems
   * @returns {Array} - System names in update order
   */
  getSystemsList() {
    return this.updateOrder.map(item => item.name);
  }
}
