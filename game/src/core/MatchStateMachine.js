// MatchStateMachine - Centralized match state management
// Orchestrates state transitions and delegates logic to state handlers

import { deltaTime } from './timing.js';

export class MatchStateMachine {
  constructor(handlers, eventBus) {
    this.handlers = handlers;
    this.eventBus = eventBus;
    this.currentState = null;
    this.previousState = null;
    this.transitionTimers = {};
    this.instance = null;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new MatchStateMachine({}, null);
    }
    return this.instance;
  }

  // Initialize with handlers and dependencies
  initialize(handlers, eventBus) {
    this.handlers = handlers;
    this.eventBus = eventBus;
  }

  // Get current state name
  getState() {
    return this.currentState;
  }

  // Get previous state name
  getPreviousState() {
    return this.previousState;
  }

  // Check if in a specific state
  isInState(stateName) {
    return this.currentState === stateName;
  }

  // Set state with validation and hooks
  setState(newState, context = {}) {
    // Validate state exists
    if (!this.handlers[newState]) {
      console.error(`❌ Invalid state: ${newState}`);
      return false;
    }

    // No change
    if (this.currentState === newState) {
      return true;
    }

    // Call exit hook on previous state
    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].onExit({ previousState: this.previousState, newState });
    }

    // Update state
    this.previousState = this.currentState;
    this.currentState = newState;

    // Call enter hook on new state
    if (this.handlers[newState]) {
      this.handlers[newState].onEnter({ previousState: this.previousState, context });
    }

    // Emit state change event
    if (this.eventBus) {
      this.eventBus.emit('game:stateChanged', {
        oldState: this.previousState,
        newState: this.currentState
      });
    }

    return true;
  }

  // Start a transition timer
  startTimer(timerName, duration) {
    this.transitionTimers[timerName] = {
      elapsed: 0,
      duration: duration,
      started: true
    };
  }

  // Update all timers
  updateTimer(timerName) {
    if (this.transitionTimers[timerName]) {
      this.transitionTimers[timerName].elapsed += deltaTime;
      return this.transitionTimers[timerName];
    }
    return null;
  }

  // Get timer progress (0-1)
  getTimerProgress(timerName) {
    const timer = this.transitionTimers[timerName];
    if (!timer) return 0;
    return Math.min(timer.elapsed / timer.duration, 1);
  }

  // Check if timer is active
  isTimerActive(timerName) {
    const timer = this.transitionTimers[timerName];
    return timer && timer.started && timer.elapsed < timer.duration;
  }

  // Check if timer is complete
  isTimerComplete(timerName) {
    const timer = this.transitionTimers[timerName];
    return timer && timer.elapsed >= timer.duration;
  }

  // Reset a timer
  resetTimer(timerName) {
    if (this.transitionTimers[timerName]) {
      this.transitionTimers[timerName].elapsed = 0;
      this.transitionTimers[timerName].started = false;
    }
  }

  // Per-frame update - delegates to current state handler
  update() {
    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].update();
    }
  }

  // Per-frame render - delegates to current state handler
  render() {
    if (this.currentState && this.handlers[this.currentState]) {
      this.handlers[this.currentState].render();
    }
  }

  // Query state-specific information
  query(question) {
    if (this.currentState && this.handlers[this.currentState]) {
      return this.handlers[this.currentState].query(question);
    }
    return null;
  }
}
