import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';

// MenuSystem — owns all overlay UI: menus, vote display, scoreboard, canvas transitions.

export class MenuSystem {
    constructor({ canvas, divMenu }) {
        this.canvas  = canvas;
        this.divMenu = divMenu;
        this._escHandler = null;
    }

    initialize() {}
    shutdown()   {}

    // ===== Canvas transitions =====

    fadeCanvas(ratio) {
        this.canvas.style.opacity = 1 - Math.min(ratio, 1);
    }

    unfadeCanvas(ratio) {
        this.canvas.style.opacity = Math.min(ratio, 1);
    }

    // ===== DOM helpers =====

    clear() {
        // Preserve party panel — it persists for the entire session
        const partyPanel = document.getElementById('partyPanel');
        this.divMenu.innerHTML = '';
        if (partyPanel) { this.divMenu.appendChild(partyPanel); }
    }

    // ===== Party panel =====

    showPartyPanel() {
        if (document.getElementById('partyPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'partyPanel';
        this.divMenu.appendChild(panel);

        // ESC opens lobby menu when in lobby state
        this._escHandler = (e) => {
            if (e.key === 'Escape' && gameState.get('game.inLobby')) {
                this.openLobbyMenu();
            }
        };
        window.addEventListener('keydown', this._escHandler);
    }

    updatePartyPanel() {
        const panel = document.getElementById('partyPanel');
        if (!panel) return;

        const { users, user, player, gameConfig } = gameServices;
        const room = gameState.get('room');
        const maxPlayers = gameConfig.room.maxPlayers;

        panel.innerHTML = '';

        const codeEl = document.createElement('span');
        codeEl.className = 'room-code';
        codeEl.textContent = room.id || '';
        panel.appendChild(codeEl);

        const slots = document.createElement('div');
        slots.className = 'party-slots';

        for (let i = 1; i <= maxPlayers; i++) {
            const slotUser = Object.values(users).find(u => u.loginOrder === i);
            const slot = document.createElement('div');
            slot.className = 'party-slot';

            if (!slotUser) {
                // Empty slot — no player in this position
                slot.classList.add('open');
                slot.textContent = '+';
            } else {
                const isLocal  = slotUser.id === user.id;
                const isLoaded = isLocal ? player.loaded : slotUser.localPlayer?.loaded;
                const charId   = isLocal ? user.localPlayer?.id : slotUser.localPlayer?.id;

                if (isLoaded && charId) {
                    slot.classList.add('filled');
                    const img = document.createElement('img');
                    img.src = `assets/textures/characters/${charId}/icon.png`;
                    slot.appendChild(img);
                } else {
                    slot.classList.add('waiting');
                    const img = document.createElement('img');
                    img.src = 'assets/textures/characters/blackCat/icon.png';
                    slot.appendChild(img);
                }

                // Kick button: host can kick non-self players
                if (user.id === room.hostId && !isLocal) {
                    const kickBtn = document.createElement('button');
                    kickBtn.className = 'kick-btn';
                    kickBtn.textContent = 'Kick';
                    kickBtn.onclick = (e) => {
                        e.stopPropagation();
                        gameServices.socketHandler.sendKickPlayer(slotUser.id);
                    };
                    slot.appendChild(kickBtn);
                }
            }

            slots.appendChild(slot);
        }

        panel.appendChild(slots);
    }

    // ===== Lobby menu (ESC) =====

    openLobbyMenu() {
        if (document.getElementById('lobbyMenu')) return;

        const room = gameState.get('room');

        const menu = document.createElement('div');
        menu.id = 'lobbyMenu';

        const codeDisplay = document.createElement('div');
        codeDisplay.className = 'lobby-room-code';
        codeDisplay.textContent = `Room: ${room.id}`;
        menu.appendChild(codeDisplay);

        const joinInput = document.createElement('input');
        joinInput.id = 'joinRoomInput';
        joinInput.placeholder = 'Enter room code';
        joinInput.maxLength = 4;
        menu.appendChild(joinInput);

        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'Join Room';
        joinBtn.onclick = () => {
            const code = joinInput.value.trim().toUpperCase();
            if (code.length === gameServices.gameConfig.room.codeLength) {
                gameServices.socketHandler.sendJoinRoom(code);
                closeMenu();
            }
        };
        menu.appendChild(joinBtn);

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = 'Leave';
        leaveBtn.onclick = () => window.location.reload();
        menu.appendChild(leaveBtn);

        const closeMenu = () => {
            if (this.divMenu.contains(menu)) { this.divMenu.removeChild(menu); }
            document.removeEventListener('click', onOutsideClick);
            window.removeEventListener('keydown', onEscKey);
        };
        const onEscKey = (e) => { if (e.key === 'Escape') closeMenu(); };
        const onOutsideClick = (e) => { if (!menu.contains(e.target)) closeMenu(); };

        this.divMenu.appendChild(menu);
        setTimeout(() => document.addEventListener('click', onOutsideClick), 0);
        window.addEventListener('keydown', onEscKey);

        joinInput.focus();
    }

    showRoomError(message) {
        const existing = document.getElementById('roomError');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'roomError';
        el.className = 'room-error';
        el.textContent = message;
        this.divMenu.appendChild(el);

        setTimeout(() => { if (this.divMenu.contains(el)) this.divMenu.removeChild(el); }, 3000);
    }

    // ===== Map voting =====

    openMapMenu() {
        gameServices.cursorSystem.showCursor();

        const chooseMapMenu = document.createElement("div");
        chooseMapMenu.setAttribute("id", "chooseMapMenu");
        this.divMenu.appendChild(chooseMapMenu);

        const closeMapMenu = () => {
            if (this.divMenu.contains(chooseMapMenu)) {
                this.divMenu.removeChild(chooseMapMenu);
            }
            document.removeEventListener("click", onOutsideClick);
            window.removeEventListener("keydown", onEscapeKey);
            gameServices.cursorSystem.hideCursor();
        };
        const onOutsideClick = (event) => {
            if (!chooseMapMenu.contains(event.target)) { closeMapMenu(); }
        };
        const onEscapeKey = (event) => {
            if (event.key === "Escape") { closeMapMenu(); }
        };

        const forestButton = document.createElement("button");
        forestButton.innerHTML = "forest";
        forestButton.addEventListener("click", () => {
            const user = gameServices.user;
            user.chooseMap.current = "forest";
            gameServices.mapSystem.vote(user.chooseMap);
            gameServices.socketHandler.sendChooseMap();
            user.chooseMap.previous = user.chooseMap.current;
            closeMapMenu();
        });
        chooseMapMenu.appendChild(forestButton);

        setTimeout(() => { document.addEventListener("click", onOutsideClick); }, 0);
        window.addEventListener("keydown", onEscapeKey);
    }

    updateVoteUI({ map, number }) {
        let voteUI = document.getElementById("voteUI");
        if (!voteUI) {
            voteUI = document.createElement("div");
            voteUI.setAttribute("id", "voteUI");
            this.divMenu.appendChild(voteUI);
        }

        const users = gameServices.users;
        const numberOfPlayers = Object.keys(users).length;
        let voteUIRow = document.getElementById("voteUI-" + map);

        if (!voteUIRow) {
            voteUIRow = document.createElement("div");
            voteUIRow.setAttribute("id", "voteUI-" + map);

            const mapIcon = document.createElement("div");
            mapIcon.style.backgroundImage = "url(assets/textures/maps/" + map + "/icon.png)";
            voteUIRow.appendChild(mapIcon);

            const mapStatus = document.createElement("span");
            mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
            voteUIRow.appendChild(mapStatus);

            voteUI.appendChild(voteUIRow);
        } else {
            if (number === 0) {
                voteUI.removeChild(voteUIRow);
            } else {
                const mapStatus = voteUIRow.querySelector("span");
                mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
            }
        }
    }

    // ===== Scoreboard =====

    showScoreBoard() {
        const user = gameServices.user;
        const users = gameServices.users;
        const player = gameServices.player;

        const scoreBoard = document.createElement("div");
        scoreBoard.setAttribute("id", "scoreBoard");
        this.divMenu.appendChild(scoreBoard);

        const playerIcon = document.createElement("img");
        playerIcon.setAttribute("src", player.characterOption
            ? `assets/textures/characters/${player.characterOption.id}/icon.png`
            : "assets/textures/characters/blackCat/icon.png");
        scoreBoard.appendChild(playerIcon);

        const playerScore = document.createElement("span");
        playerScore.innerHTML = user.points.victories + " points";
        scoreBoard.appendChild(playerScore);

        for (let i in users) {
            if (i === user.id) continue;

            const remotePlayer = users[i].remotePlayer;
            const remotePlayerIcon = document.createElement("img");
            remotePlayerIcon.setAttribute("src", remotePlayer && remotePlayer.characterId
                ? `assets/textures/characters/${remotePlayer.characterId}/icon.png`
                : "assets/textures/characters/blackCat/icon.png");
            scoreBoard.appendChild(remotePlayerIcon);

            const remotePlayerScore = document.createElement("span");
            remotePlayerScore.innerHTML = users[i].points.victories + " points";
            scoreBoard.appendChild(remotePlayerScore);
        }

        const noPlayerDied = !player.dead &&
            Object.values(users).every(u => u.id === user.id || !u.localPlayer.dead);
        if (noPlayerDied) {
            const tooEasy = document.createElement("span");
            tooEasy.innerHTML = "too easy!";
            scoreBoard.appendChild(tooEasy);
        }
    }
}
