import { gameState } from '../core/GameState.js';
import { showDebugMenu } from '../core/RenderContext.js';
import { MainMenu } from './menus/MainMenu.js';
import { RoomPanel } from './menus/RoomPanel.js';
import { ChatMenu } from './menus/ChatMenu.js';
import { MapMenu } from './menus/MapMenu.js';
import { HintMenu } from './menus/HintMenu.js';
import { ScoreboardPanel } from './menus/ScoreboardPanel.js';
import { DebugMenu } from './menus/DebugMenu.js';

// MenuSystem — thin coordinator; delegates to focused sub-classes.
// Public API is unchanged so all callers outside this file require no edits.

export class MenuSystem {
    constructor({ divMenu, profiler }) {
        this.divMenu = divMenu;

        this._mainMenu   = new MainMenu({ divMenu });
        this._chatMenu   = new ChatMenu({ divMenu });
        this._mapMenu    = new MapMenu({ divMenu });
        this._hintMenu   = new HintMenu({ divMenu });
        this._scoreboard = new ScoreboardPanel({ divMenu });
        this._roomPanel  = new RoomPanel({ divMenu });
        this._debugMenu  = showDebugMenu ? new DebugMenu(profiler) : null;
    }

    initialize() {
        document.getElementById('vignette').classList.toggle('hidden', !gameState.get('settings.vignette'));
        this._mainMenu.initialize();
        this.showMenuHint();
        if (this._debugMenu) { this._debugMenu.initialize(); }
        this._createKeyDownEvent();
    }

    _createKeyDownEvent() {
        window.addEventListener('keydown', (e) => {
            // Handle Escape (Close things)
            if (e.key === 'Escape') {
                if (this._chatMenu.isInputOpen) {
                    this._chatMenu.closeInput();
                    return;
                }
                if (this._mapMenu.handleToggleMenu()) return;
                if (this._mainMenu.isOpen) {
                    this._mainMenu.close();
                    return;
                }
                if (document.getElementById('roomPanel')) this._mainMenu.open();
            }
            
            // Handle Enter (Open Chat)
            if (e.key === 'Enter') {
                if (!this._mainMenu.isOpen && !this._chatMenu.isInputOpen) {
                    this._chatMenu.openInput();
                }
            }

            // Handle Backquote/Tilde (Toggle Debug Menu)
            if (e.key === '`' || e.key === '~') {
                // Prevent triggering if typing in the chat box
                if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
                if (this._debugMenu) {
                    e.preventDefault();
                    this._debugMenu.toggle();
                }
            }
        });
    }

    shutdown() {}

    // ===== DOM helpers =====

    clear() {
        const roomPanel = document.getElementById('roomPanel');
        this.divMenu.innerHTML = '';
        if (roomPanel) { this.divMenu.appendChild(roomPanel); }
        this._chatMenu.clearDomRefs();
    }

    // ===== Room panel =====

    showPartyPanel() {
        this._roomPanel.show();
    }

    updatePartyPanel() { this._roomPanel.update(); }

    // ===== Main menu =====

    openMainMenu()  { this._mainMenu.open(); }
    closeMainMenu() { this._mainMenu.close(); }

    get isMenuOpen() { return this._mainMenu.isOpen; }

    // ===== Chat =====

    showChatBubble(userId, message) { this._chatMenu.showBubble(userId, message); }

    // ===== Room error =====

    showRoomError(message) { this._roomPanel.showError(message); }

    // ===== Map voting =====

    openMapMenu()  { this._mapMenu.open(); }
    openMatchSettings() { this._mapMenu.openSettings(); }
    closeMapMenu() { this._mapMenu.close(); }
    refreshMapMenuSettings() { this._mapMenu.refreshSettings(); }

    updateVoteUI(data) { this._roomPanel.updateVoteUI(data); }
    clearVoteUI()      { this._roomPanel.clearVoteUI(); }

    // ===== Scoreboard =====

    showScoreBoard()      { this._scoreboard.show(); }
    startScoreBoardExit() { this._scoreboard.startExit(); }
    showWinner(winnerId)  { this._scoreboard.showWinner(winnerId); }
    hideWinner()          { this._scoreboard.hideWinner(); }

    // ===== Hint =====

    showHint(message)        { this._hintMenu.show(message); }
    showHintWithBar(message) { this._hintMenu.showWithBar(message); }
    hideHint()               { this._hintMenu.hide(); }
    updateHintBar(ratio)     { this._hintMenu.updateBar(ratio); }
    showMenuHint()           { this._hintMenu.showMenuHint(() => this._mainMenu.open()); }
    hideMenuHint()           { this._hintMenu.hideMenuHint(); }
}
