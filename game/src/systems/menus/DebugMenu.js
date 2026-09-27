// DebugMenu - Debug panel for monitoring performance and toggling tools

import { gameServices } from '../../core/GameServices.js';
import { renderContext, showHitboxes } from '../../core/RenderContext.js';

export class DebugMenu {
    constructor(profiler) {
        this._profiler = profiler;
        this._expanded = false;
        this._panel = null;
        this._arrow = null;
        this._content = null;
        this._fpsEl = null;
        this._pingEl = null;
        this._stateEl = null;
        this._hitboxBtn = null;
        this._interval = null;
    }

    initialize() {
        this._createPanel();
    }

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

    _updateUI() {
        this._arrow.textContent = this._expanded ? '▼' : '▶';
        this._content.style.display = this._expanded ? 'block' : 'none';
    }

    _update() {
        const { fps, logicMs } = this._profiler.snapshot();
        const ping = gameServices.socketHandler.ping;
        const state = gameServices.matchStateMachine.currentState;
        this._fpsEl.textContent = `FPS: ${fps} | Logic: ${logicMs.toFixed(2)}ms`;
        this._pingEl.textContent = `Ping: ${ping}ms`;
        this._stateEl.textContent = state;
    }

    _createPanel() {
        this._panel = document.createElement('div');
        this._panel.className = 'debug-panel';
        document.body.appendChild(this._panel);

        this._arrow = document.createElement('button');
        this._arrow.className = 'debug-arrow';
        this._arrow.textContent = '▶';
        this._arrow.addEventListener('click', () => this._toggle());
        this._panel.appendChild(this._arrow);

        this._content = document.createElement('div');
        this._content.className = 'debug-content';
        this._content.style.display = 'none';
        this._panel.appendChild(this._content);

        const title = document.createElement('div');
        title.className = 'debug-title';
        title.textContent = '[ DEBUG ]';
        this._content.appendChild(title);

        this._fpsEl = document.createElement('div');
        this._fpsEl.className = 'debug-fps';
        this._content.appendChild(this._fpsEl);

        this._pingEl = document.createElement('div');
        this._pingEl.className = 'debug-fps';
        this._content.appendChild(this._pingEl);

        const separator = document.createElement('div');
        separator.className = 'debug-sep';
        this._content.appendChild(separator);

        const stateLabel = document.createElement('div');
        stateLabel.className = 'debug-state-label';
        stateLabel.textContent = 'STATE';
        this._content.appendChild(stateLabel);

        this._stateEl = document.createElement('div');
        this._stateEl.className = 'debug-state-value';
        this._content.appendChild(this._stateEl);

        const actionSeparator = document.createElement('div');
        actionSeparator.className = 'debug-sep';
        this._content.appendChild(actionSeparator);

        this._hitboxBtn = this._createButton('', () => {
            renderContext.setShowHitboxes(!showHitboxes);
            this._updateHitboxButton();
        });
        this._content.appendChild(this._hitboxBtn);
        this._updateHitboxButton();

        const matchSettingsBtn = this._createButton('MATCH SETTINGS', () => {
            gameServices.menuSystem.openMatchSettings();
        });
        this._content.appendChild(matchSettingsBtn);
    }

    _createButton(label, onClick) {
        const button = document.createElement('button');
        button.className = 'debug-action-btn';
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    _updateHitboxButton() {
        const enabled = showHitboxes;
        this._hitboxBtn.textContent = `HITBOXES: ${enabled ? 'ON' : 'OFF'}`;
        this._hitboxBtn.setAttribute('aria-pressed', String(enabled));
    }
}
