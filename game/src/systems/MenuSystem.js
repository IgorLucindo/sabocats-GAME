import { gameState } from '../core/GameState.js';
import { showDebugMenu } from '../core/RenderContext.js';
import { MainMenu } from './menus/MainMenu.js';
import { RoomPanel } from './menus/RoomPanel.js';
import { ChatSystem } from './menus/ChatSystem.js';
import { MapMenu } from './menus/MapMenu.js';
import { HintSystem } from './menus/HintSystem.js';
import { ScoreboardPanel } from './menus/ScoreboardPanel.js';
import { DebugMenu } from './menus/DebugMenu.js';

// MenuSystem — thin coordinator; delegates to focused sub-classes.
// Public API is unchanged so all callers outside this file require no edits.

export class MenuSystem {
    constructor({ canvas, divMenu, profiler }) {
        this.divMenu = divMenu;

        this._mainMenu        = new MainMenu({ divMenu });
        this._chatSystem      = new ChatSystem({ divMenu });
        this._mapMenu         = new MapMenu({ divMenu });
        this._hintSystem      = new HintSystem({ divMenu });
        this._scoreboard      = new ScoreboardPanel({ divMenu });
        this._roomPanel       = new RoomPanel({ divMenu });
        this._debugMenu       = showDebugMenu ? new DebugMenu(profiler) : null;
    }

    initialize() {
        document.getElementById('vignette').classList.toggle('hidden', !gameState.get('settings.vignette'));
        this._mainMenu.initialize();
        if (this._debugMenu) { this._debugMenu.initialize(); }
    }

    shutdown() {}

    // ===== DOM helpers =====

    clear() {
        const roomPanel = document.getElementById('roomPanel');
        this.divMenu.innerHTML = '';
        if (roomPanel) { this.divMenu.appendChild(roomPanel); }
        this._chatSystem.clearDomRefs();
    }

    resetIconStates() { this._roomPanel.resetIconStates(); }

    // ===== Room panel =====

    showPartyPanel() {
        this._roomPanel.show(
            () => this.openMainMenu(),
            () => this._chatSystem.openInput()
        );
    }

    updatePartyPanel() { this._roomPanel.update(); }

    // ===== Main menu =====

    openMainMenu()  { this._mainMenu.open(); }
    closeMainMenu() { this._mainMenu.close(); }

    get isMenuOpen() { return this._mainMenu.isOpen; }

    // ===== Chat =====

    showChatBubble(userId, message) { this._chatSystem.showBubble(userId, message); }

    // ===== Room error =====

    showRoomError(message) { this._roomPanel.showError(message); }

    // ===== Map voting =====

    openMapMenu()  { this._mapMenu.open(); }
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

    showHint(message)        { this._hintSystem.show(message); }
    showHintWithBar(message) { this._hintSystem.showWithBar(message); }
    hideHint()               { this._hintSystem.hide(); }
    updateHintBar(ratio)     { this._hintSystem.updateBar(ratio); }
    showLobbyHint()          { this._hintSystem.showLobbyHint(() => this._mainMenu.open()); }
    hideLobbyHint()          { this._hintSystem.hideLobbyHint(); }
}
