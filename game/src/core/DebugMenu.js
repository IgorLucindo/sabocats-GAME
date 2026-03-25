// DebugMenu - Debug panel for navigating game states and monitoring performance
// Collapsible UI with arrow toggle, expandable state picker

import { gameServices } from './GameServices.js';

const STATES = ['choosing', 'placing', 'playing', 'scoreboard'];

export class DebugMenu {
    constructor(profiler) {
        this._profiler = profiler;
        this._expanded = false;
        this._stateMenuOpen = false;
        this._panel    = null;
        this._arrow    = null;
        this._content  = null;
        this._fpsEl    = null;
        this._stateBtn = null;
        this._stateMenu = null;
        this._interval = null;
    }

    initialize() {
        this._createPanel();
    }

    // ===== Private =====

    _toggle() {
        this._expanded = !this._expanded;
        this._updateUI();
        if (this._expanded) {
            this._update();
            this._interval = setInterval(() => this._update(), 1000);
        } else {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    _toggleStateMenu() {
        this._stateMenuOpen = !this._stateMenuOpen;
        this._stateMenu.style.display = this._stateMenuOpen ? 'block' : 'none';
    }

    _closeStateMenu() {
        this._stateMenuOpen = false;
        this._stateMenu.style.display = 'none';
    }

    _updateUI() {
        this._arrow.textContent = this._expanded ? '▼' : '▶';
        this._content.style.display = this._expanded ? 'block' : 'none';
    }

    _update() {
        const { fps, logicMs } = this._profiler.snapshot();
        const state = gameServices.matchStateMachine.currentState ?? 'lobby';
        this._fpsEl.textContent = `FPS: ${fps} | Logic: ${logicMs.toFixed(2)}ms`;
        this._stateBtn.textContent = state;
    }

    _createPanel() {
        this._panel = document.createElement('div');
        this._panel.className = 'debug-panel';
        document.body.appendChild(this._panel);

        // Arrow button
        this._arrow = document.createElement('button');
        this._arrow.className = 'debug-arrow';
        this._arrow.textContent = '▶';
        this._arrow.addEventListener('click', () => this._toggle());
        this._panel.appendChild(this._arrow);

        // Content panel
        this._content = document.createElement('div');
        this._content.className = 'debug-content';
        this._content.style.display = 'none';
        this._panel.appendChild(this._content);

        // Title
        const title = document.createElement('div');
        title.className = 'debug-title';
        title.textContent = '[ DEBUG ]';
        this._content.appendChild(title);

        // FPS
        this._fpsEl = document.createElement('div');
        this._fpsEl.className = 'debug-fps';
        this._content.appendChild(this._fpsEl);

        // Separator
        const sep1 = document.createElement('div');
        sep1.className = 'debug-sep';
        this._content.appendChild(sep1);

        // State label
        const stateLabel = document.createElement('div');
        stateLabel.className = 'debug-state-label';
        stateLabel.textContent = 'STATE';
        this._content.appendChild(stateLabel);

        // State button (clickable)
        this._stateBtn = document.createElement('button');
        this._stateBtn.className = 'debug-state-btn';
        this._stateBtn.addEventListener('click', () => this._toggleStateMenu());
        this._content.appendChild(this._stateBtn);

        // State menu (dropdown)
        this._stateMenu = document.createElement('div');
        this._stateMenu.className = 'debug-state-menu';
        this._content.appendChild(this._stateMenu);

        for (const state of STATES) {
            const option = document.createElement('div');
            option.className = 'debug-state-option';
            option.textContent = state;
            option.addEventListener('click', () => {
                gameServices.matchStateMachine.setState(state);
                this._update();
                this._closeStateMenu();
            });
            this._stateMenu.appendChild(option);
        }

        // Separator
        const sep2 = document.createElement('div');
        sep2.className = 'debug-sep';
        this._content.appendChild(sep2);

        // Map voting button
        const mapBtn = document.createElement('button');
        mapBtn.className = 'debug-state-btn';
        mapBtn.textContent = 'VOTE MAPS';
        mapBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!gameServices.menuSystem) {
                console.error('menuSystem not initialized');
                return;
            }
            if (!gameServices.divMenu) {
                console.error('divMenu not available');
                return;
            }
            gameServices.menuSystem.openMapMenu();
        });
        this._content.appendChild(mapBtn);
    }
}
