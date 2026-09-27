// OverlayManager — manages fullscreen DOM overlays (start screen, rotate prompt)

import { gameState } from './GameState.js';
import { gameServices } from './GameServices.js';

export class OverlayManager {
  constructor() {
    this._rotateOverlay = null;
    this._startOverlay = null;
    this._startInputHandler = null;
  }

  initialize() {
    this._rotateOverlay = document.getElementById('rotate-overlay');
    if (gameState.get('environment.isTouch')) {
      this._checkOrientation();
      window.addEventListener('resize', () => this._checkOrientation());
      window.addEventListener('orientationchange', () => this._checkOrientation());
    }

    // Use one dismissal path for the existing dev-room opt-out and confirmed reconnects.
    // The reconnect case only skips after the server confirms that the session resumed.
    gameServices.eventBus.once('network:reconnectHydrate', () => this._skipStartScreen());
    if (gameServices.gameConfig.debug.joinDevRoom) {
      this._skipStartScreen();
    } else {
      // Let networking initialize behind the overlay so a reconnect can dismiss it.
      this._showStartScreen();
    }
  }

  _showStartScreen() {
    const overlay = this._createStartElement();
    this._startOverlay = overlay;
    document.body.appendChild(overlay);

    this._startInputHandler = () => {
      // On touch devices, block dismissal when in landscape (wrong orientation)
      if (!gameState.get('environment.isLandscape')) return;
      this._removeStartInputListeners();
      overlay.classList.add('start-fade-out');
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        if (this._startOverlay === overlay) this._startOverlay = null;
      }, { once: true });
    };

    window.addEventListener('keydown', this._startInputHandler);
    window.addEventListener('click', this._startInputHandler);
    window.addEventListener('touchstart', this._startInputHandler);
  }

  _removeStartInputListeners() {
    if (!this._startInputHandler) return;
    window.removeEventListener('keydown', this._startInputHandler);
    window.removeEventListener('click', this._startInputHandler);
    window.removeEventListener('touchstart', this._startInputHandler);
    this._startInputHandler = null;
  }

  _skipStartScreen() {
    this._removeStartInputListeners();
    this._startOverlay?.remove();
    this._startOverlay = null;
  }

  _checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    gameState.set('environment.isLandscape', isLandscape);
    this._rotateOverlay.classList.toggle('visible', !isLandscape);
  }

  _createStartElement() {
    const overlay = document.createElement('div');
    overlay.id = 'startScreen';

    const title = document.createElement('div');
    title.className = 'start-title';
    title.textContent = 'SaboCats';
    overlay.appendChild(title);

    const prompt = document.createElement('div');
    prompt.className = 'start-prompt';
    prompt.textContent = 'PRESS ANY KEY TO START';
    overlay.appendChild(prompt);

    return overlay;
  }
}
