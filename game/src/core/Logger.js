// Logger - Centralized logging with debug level control
import { GameConfig } from './DataLoader.js';

export const Logger = {
  debug: (msg, data) => {
    if (GameConfig.debug.enabled) {
      console.log(`[DEBUG] ${msg}`, data ?? '');
    }
  },

  info: (msg, data) => {
    console.log(`[INFO] ${msg}`, data ?? '');
  },

  warn: (msg, data) => {
    console.warn(`[WARN] ${msg}`, data ?? '');
  },

  error: (msg, data) => {
    console.error(`[ERROR] ${msg}`, data ?? '');
  }
};
