// OverlayManager — manages fullscreen DOM overlays (start screen, rotate prompt)

import { gameState } from './GameState.js';
import { gameServices } from './GameServices.js';

export class OverlayManager {
  constructor() {
    this._rotateOverlay = null;
  }

  async initialize() {
    this._rotateOverlay = document.getElementById('rotate-overlay');
    if (gameState.get('environment.isTouch')) {
      this._checkOrientation();
      window.addEventListener('resize', () => this._checkOrientation());
      window.addEventListener('orientationchange', () => this._checkOrientation());
    }

    if (!gameServices.gameConfig.debug.joinDevRoom) {
      await this._showStartScreen();
    }
  }

  _showStartScreen() {
    return new Promise((resolve) => {
      const overlay = this._createStartElement();
      document.body.appendChild(overlay);

      const onInput = () => {
        // On touch devices, block dismissal when in landscape (wrong orientation)
        if (!gameState.get('environment.isLandscape')) return;
        window.removeEventListener('keydown', onInput);
        window.removeEventListener('click', onInput);
        window.removeEventListener('touchstart', onInput);
        overlay.classList.add('start-fade-out');
        overlay.addEventListener('transitionend', () => {
          overlay.remove();
          resolve();
        }, { once: true });
      };

      window.addEventListener('keydown', onInput);
      window.addEventListener('click', onInput);
      window.addEventListener('touchstart', onInput);
    });
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
