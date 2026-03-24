// MatchStateMachine - Centralized match state management
// Orchestrates state transitions and delegates logic to state handlers

import { deltaTime } from './timing.js';
import { Logger } from './Logger.js';

export class MatchStateMachine {
  constructor(handlers, eventBus) {
    this.handlers = handlers;
    this.eventBus = eventBus;
    this.currentState = null;
    this.previousState = null;
    this.transitionTimers = {};
  }

  getState() {
    return this.currentState;
  }

  setState(newState, context = {}) {
    if (!this.handlers[newState]) {
      Logger.error(`Invalid state: ${newState}`);
      return false;
    }

    if (this.currentState === newState) {
      return true;
    }

    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].onExit({ previousState: this.previousState, newState });
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (this.handlers[newState]) {
      this.handlers[newState].onEnter({ previousState: this.previousState, context });
    }

    if (this.eventBus) {
      this.eventBus.emit('game:stateChanged', {
        oldState: this.previousState,
        newState: this.currentState
      });
    }

    return true;
  }

  startTimer(timerName, duration) {
    this.transitionTimers[timerName] = {
      elapsed: 0,
      duration: duration,
      started: true
    };
  }

  updateTimer(timerName) {
    if (this.transitionTimers[timerName]) {
      this.transitionTimers[timerName].elapsed += deltaTime;
      return this.transitionTimers[timerName];
    }
    return null;
  }

  getTimerProgress(timerName) {
    const timer = this.transitionTimers[timerName];
    if (!timer) return 0;
    return Math.min(timer.elapsed / timer.duration, 1);
  }

  isTimerActive(timerName) {
    const timer = this.transitionTimers[timerName];
    return timer && timer.started && timer.elapsed < timer.duration;
  }

  isTimerComplete(timerName) {
    const timer = this.transitionTimers[timerName];
    return timer && timer.elapsed >= timer.duration;
  }

  resetTimer(timerName) {
    if (this.transitionTimers[timerName]) {
      this.transitionTimers[timerName].elapsed = 0;
      this.transitionTimers[timerName].started = false;
    }
  }

  update() {
    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].update();
    }
  }

  render() {
    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].render();
    }
  }
}
