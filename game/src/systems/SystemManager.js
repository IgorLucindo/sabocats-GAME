// SystemManager - Orchestrates all game systems

import { Logger } from '../core/Logger.js';

export class SystemManager {
  constructor() {
    this.systems = {};
    this.updateOrder = [];
  }

  register(name, system, priority = 100) {
    this.systems[name] = { instance: system, priority };
    this.updateOrder.push({ name, priority });
    this.updateOrder.sort((a, b) => a.priority - b.priority);
    Logger.debug(`Registered system: ${name}`);
  }

  initializeAll() {
    for (let item of this.updateOrder) {
      const system = this.systems[item.name].instance;
      if (system.initialize) {
        system.initialize();
      }
    }
    Logger.debug(`Initialized ${this.updateOrder.length} systems`);
  }
}
