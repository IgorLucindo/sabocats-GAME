import { gameState } from '../core/GameState.js';
import { MainMenu } from './menu/MainMenu.js';
import { RoomPanel } from './menu/RoomPanel.js';
import { ChatSystem } from './menu/ChatSystem.js';
import { MapMenu } from './menu/MapMenu.js';
import { HintSystem } from './menu/HintSystem.js';
import { ScoreboardPanel } from './menu/ScoreboardPanel.js';

// MenuSystem — thin coordinator; delegates to focused sub-classes.
// Public API is unchanged so all callers outside this file require no edits.

export class MenuSystem {
    constructor({ canvas, divMenu }) {
        this.canvas  = canvas;
        this.divMenu = divMenu;

        this.mainMenu   = new MainMenu({ canvas, divMenu });
        this.chatSystem = new ChatSystem({ divMenu });
        this.mapMenu    = new MapMenu({ divMenu });
        this.hintSystem = new HintSystem({ divMenu });
        this.scoreboard = new ScoreboardPanel({ divMenu });
        this.roomPanel  = new RoomPanel({ divMenu });
    }

    initialize() {
        document.getElementById('vignette').classList.toggle('hidden', !gameState.get('settings.vignette'));
        this.mainMenu.initialize();
    }

    shutdown() {}

    // ===== Canvas transitions =====

    fadeCanvas(ratio) {
        this.canvas.style.opacity = 1 - Math.min(ratio, 1);
    }

    unfadeCanvas(ratio) {
        this.canvas.style.opacity = Math.min(ratio, 1);
    }

    // ===== DOM helpers =====

    clear() {
        const roomPanel = document.getElementById('roomPanel');
        this.divMenu.innerHTML = '';
        if (roomPanel) { this.divMenu.appendChild(roomPanel); }
        this.chatSystem.clearDomRefs();
    }

    resetIconStates() { this.roomPanel.resetIconStates(); }

    // ===== Room panel =====

    showPartyPanel() {
        this.roomPanel.show(
            () => this.openMainMenu(),
            () => this.chatSystem.openInput()
        );
    }

    updatePartyPanel() { this.roomPanel.update(); }

    // ===== Main menu =====

    openMainMenu()  { this.mainMenu.open(); }
    closeMainMenu() { this.mainMenu.close(); }

    get isMenuOpen() { return this.mainMenu.isOpen; }

    // ===== Chat =====

    showChatBubble(userId, message) { this.chatSystem.showBubble(userId, message); }

    // ===== Room error =====

    showRoomError(message) { this.roomPanel.showError(message); }

    // ===== Map voting =====

    openMapMenu()  { this.mapMenu.open(); }
    closeMapMenu() { this.mapMenu.close(); }

    updateVoteUI(data) { this.roomPanel.updateVoteUI(data); }
    clearVoteUI()      { this.roomPanel.clearVoteUI(); }

    // ===== Scoreboard =====

    showScoreBoard()      { this.scoreboard.show(); }
    startScoreBoardExit() { this.scoreboard.startExit(); }

    // ===== Hint =====

    showHint(message)        { this.hintSystem.show(message); }
    showHintWithBar(message) { this.hintSystem.showWithBar(message); }
    hideHint()               { this.hintSystem.hide(); }
    updateHintBar(ratio)     { this.hintSystem.updateBar(ratio); }
    showLobbyHint()          { this.hintSystem.showLobbyHint(() => this.mainMenu.open()); }
    hideLobbyHint()          { this.hintSystem.hideLobbyHint(); }
}
