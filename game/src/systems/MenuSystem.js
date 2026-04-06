import { gameServices } from '../core/GameServices.js';
import { gameState } from '../core/GameState.js';

// MenuSystem — owns all overlay UI: menus, vote display, scoreboard, canvas transitions.

export class MenuSystem {
    constructor({ canvas, divMenu }) {
        this.canvas  = canvas;
        this.divMenu = divMenu;
        this._escHandler        = null;
        this._mainMenuEl        = null;
        this._mainMenuEscHandler = null;
    }

    initialize() {
        document.getElementById('vignette').classList.toggle('hidden', !gameState.get('settings.vignette'));
    }
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
        // Preserve room panel — it persists for the entire session
        const roomPanel = document.getElementById('roomPanel');
        this.divMenu.innerHTML = '';
        if (roomPanel) { this.divMenu.appendChild(roomPanel); }
    }

    // ===== Room panel =====

    showPartyPanel() {
        if (document.getElementById('roomPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'roomPanel';
        this.divMenu.appendChild(panel);

        this._escHandler = (e) => {
            if (e.key === 'Escape' && !document.getElementById('mainMenu')) {
                this.openMainMenu();
            }
        };
        window.addEventListener('keydown', this._escHandler);

        this._chatEnterHandler = (e) => {
            if (e.key === 'Enter' && !document.getElementById('mainMenu') && !document.getElementById('chatInputBar')) {
                this._openChatInput();
            }
        };
        window.addEventListener('keydown', this._chatEnterHandler);
    }

    updatePartyPanel() {
        const panel = document.getElementById('roomPanel');
        if (!panel) return;

        const { users, user, player, gameConfig } = gameServices;
        const room = gameState.get('room');
        const maxPlayers = gameConfig.room.maxPlayers;

        // Preserve vote UI across rebuild
        const voteUI = document.getElementById('voteUI');
        panel.innerHTML = '';

        const slots = document.createElement('div');
        slots.className = 'room-slots';

        for (let i = 1; i <= maxPlayers; i++) {
            const slotUser = Object.values(users).find(u => u.loginOrder === i);
            const slot = document.createElement('div');
            slot.className = 'room-slot';

            if (!slotUser) {
                slot.classList.add('open');
                slot.textContent = '+';
            } else {
                const isLocal  = slotUser.id === user.id;
                const isLoaded = isLocal ? player.loaded : slotUser.remotePlayer?.loaded;
                const charId   = isLocal ? user.localPlayer?.id : slotUser.remotePlayer?.characterId;
                const inMatch  = gameServices.inMatch;

                if (charId && (inMatch || isLoaded)) {
                    slot.classList.add('filled');
                    const img = document.createElement('img');
                    img.src = `assets/textures/characters/${charId}/icon.png`;
                    slot.appendChild(img);
                } else {
                    slot.classList.add('waiting');
                    const img = document.createElement('img');
                    img.src = 'assets/textures/characters/placeholderCat/icon.png';
                    slot.appendChild(img);
                }

                if (user.id === room.hostId && !isLocal) {
                    const kickBtn = document.createElement('button');
                    kickBtn.className = 'room-slot-kick';
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
        if (voteUI) panel.appendChild(voteUI);
    }

    // ===== Main menu =====

    openMainMenu() {
        if (document.getElementById('mainMenu')) return;

        this._cursorWasVisible = document.body.style.cursor !== 'none';
        gameServices.cursorSystem.showCursor();

        const menu = document.createElement('div');
        menu.id = 'mainMenu';
        this.divMenu.appendChild(menu);
        requestAnimationFrame(() => menu.classList.add('open'));

        this._mainMenuEl = menu;
        this._renderMainMenuRoot();

        this._mainMenuEscHandler = (e) => {
            if (e.key === 'Escape') this.closeMainMenu();
        };
        window.addEventListener('keydown', this._mainMenuEscHandler);
    }

    closeMainMenu() {
        const menu = document.getElementById('mainMenu');
        if (!menu) return;

        menu.classList.remove('open');
        menu.addEventListener('transitionend', () => menu.remove(), { once: true });

        window.removeEventListener('keydown', this._mainMenuEscHandler);

        if (!this._cursorWasVisible) { gameServices.cursorSystem.hideCursor(); }
    }

    _renderMainMenuRoot() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Menu';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const resume   = this._mmBtn('Resume',    () => this.closeMainMenu());
        const joinRoom = this._mmBtn('Join Room', () => this._renderJoinRoom());
        const visuals  = this._mmBtn('Visuals',   () => this._renderVisuals());
        const settings = this._mmBtn('Settings',  () => this._renderSettings());
        const leave    = this._mmBtn('Leave',      () => window.location.reload());
        leave.classList.add('mm-btn-danger');

        panel.append(resume, joinRoom, visuals, settings, leave);
        menu.innerHTML = '';
        menu.append(title, panel);
    }

    _renderJoinRoom() {
        const menu = this._mainMenuEl;
        const room = gameState.get('room');

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Join Room';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const back = this._mmBtn('Back', () => this._renderMainMenuRoot());
        back.classList.add('mm-btn-back');

        // — Code input section —
        const inputSection = document.createElement('div');
        inputSection.className = 'mm-section';

        const inputLabel = document.createElement('div');
        inputLabel.className = 'mm-label';
        inputLabel.textContent = 'Room Code';

        const input = document.createElement('input');
        input.className = 'mm-input';
        input.placeholder = 'Enter Code';
        input.maxLength = gameServices.gameConfig.room.codeLength;

        const joinBtn = document.createElement('button');
        joinBtn.className = 'mm-join-btn';
        joinBtn.textContent = 'Join';
        joinBtn.onclick = () => {
            const code = input.value.trim().toUpperCase();
            if (code.length === gameServices.gameConfig.room.codeLength) {
                gameServices.socketHandler.sendJoinRoom(code);
                this.closeMainMenu();
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') joinBtn.click();
        });

        const inputRow = document.createElement('div');
        inputRow.className = 'mm-input-row';
        inputRow.append(input, joinBtn);
        inputSection.append(inputLabel, inputRow);

        // — Rooms list section —
        const listSection = document.createElement('div');
        listSection.className = 'mm-section mm-rooms-section';

        const listHeader = document.createElement('div');
        listHeader.className = 'mm-rooms-header';

        const listLabel = document.createElement('div');
        listLabel.className = 'mm-label';
        listLabel.textContent = 'Rooms';

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'mm-refresh-btn';
        refreshBtn.textContent = '↻';
        refreshBtn.title = 'Refresh';

        listHeader.append(listLabel, refreshBtn);

        const listEl = document.createElement('div');
        listEl.className = 'mm-rooms-list';

        const fetchRooms = () => {
            listEl.innerHTML = '<div class="mm-rooms-empty">Loading…</div>';
            refreshBtn.disabled = true;
            gameServices.socketHandler.sendGetRooms((rooms) => {
                refreshBtn.disabled = false;
                listEl.innerHTML = '';
                if (rooms.length === 0) {
                    listEl.innerHTML = '<div class="mm-rooms-empty">No rooms found</div>';
                    return;
                }
                for (const r of rooms) {
                    const row = document.createElement('div');
                    row.className = 'mm-room-row';
                    if (r.id === room.id) row.classList.add('mm-room-current');

                    const code = document.createElement('span');
                    code.className = 'mm-room-code';
                    code.textContent = r.id;

                    const count = document.createElement('span');
                    count.className = 'mm-room-count';
                    count.textContent = `${r.playerCount}/${r.maxPlayers}`;

                    const joinRowBtn = document.createElement('button');
                    joinRowBtn.className = 'mm-room-join-btn';
                    joinRowBtn.textContent = r.id === room.id ? 'here' : '→';
                    joinRowBtn.disabled = r.id === room.id || r.playerCount >= r.maxPlayers;

                    joinRowBtn.onclick = () => {
                        gameServices.socketHandler.sendJoinRoom(r.id);
                        this.closeMainMenu();
                    };

                    row.append(code, count, joinRowBtn);
                    listEl.appendChild(row);
                }
            });
        };

        refreshBtn.onclick = fetchRooms;
        listSection.append(listHeader, listEl);

        panel.append(back, inputSection, listSection);
        menu.innerHTML = '';
        menu.append(title, panel);

        input.focus();
        fetchRooms();
    }

    _renderVisuals() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Visuals';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const back = this._mmBtn('Back', () => this._renderMainMenuRoot());
        back.classList.add('mm-btn-back');

        const section = document.createElement('div');
        section.className = 'mm-section';

        const label = document.createElement('div');
        label.className = 'mm-label';
        label.textContent = 'Effects';

        const vignetteRow = document.createElement('button');
        vignetteRow.className = 'mm-toggle-row';

        const rowLabel = document.createElement('span');
        rowLabel.textContent = 'Vignette';

        const indicator = document.createElement('span');
        indicator.className = 'mm-toggle-indicator';

        const applyState = (on) => {
            indicator.textContent = on ? 'ON' : 'OFF';
            indicator.classList.toggle('mm-toggle-on', on);
            document.getElementById('vignette').classList.toggle('hidden', !on);
            gameState.set('settings.vignette', on);
        };

        applyState(gameState.get('settings.vignette'));

        vignetteRow.onclick = () => applyState(!gameState.get('settings.vignette'));
        vignetteRow.append(rowLabel, indicator);
        section.append(label, vignetteRow);
        panel.append(back, section);
        menu.innerHTML = '';
        menu.append(title, panel);
    }

    _renderSettings() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Settings';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const back = this._mmBtn('Back', () => this._renderMainMenuRoot());
        back.classList.add('mm-btn-back');

        const section = document.createElement('div');
        section.className = 'mm-section';

        const label = document.createElement('div');
        label.className = 'mm-label';
        label.textContent = 'Volume';

        const currentVolume = gameState.get('settings.volume');

        const sliderRow = document.createElement('div');
        sliderRow.className = 'mm-slider-row';

        const slider = document.createElement('input');
        slider.type  = 'range';
        slider.className = 'mm-slider';
        slider.min   = 0;
        slider.max   = 1;
        slider.step  = 0.01;
        slider.value = currentVolume;

        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'mm-slider-value';
        valueDisplay.textContent = Math.round(currentVolume * 100) + '%';

        slider.oninput = () => {
            const v = parseFloat(slider.value);
            gameState.set('settings.volume', v);
            valueDisplay.textContent = Math.round(v * 100) + '%';
        };

        sliderRow.append(slider, valueDisplay);
        section.append(label, sliderRow);
        panel.append(back, section);
        menu.innerHTML = '';
        menu.append(title, panel);
    }

    // ===== Chat =====

    _openChatInput() {
        const cursorSystem     = gameServices.cursorSystem;
        const inputSystem      = gameServices.inputSystem;
        const cursorWasVisible = document.body.style.cursor !== 'none';

        cursorSystem.showCursor();
        inputSystem.disabled = true;
        for (const key in inputSystem.keys) { inputSystem.keys[key].pressed = false; }

        const bar = document.createElement('div');
        bar.id = 'chatInputBar';

        // — Emoji button —
        const EMOJIS = ['😂','😎','🤔','😭','😡','💀','🤡'];
        let picker = null;

        const emojiBtn = document.createElement('button');
        emojiBtn.id    = 'chatEmojiBtn';
        emojiBtn.textContent = '💬';
        emojiBtn.title = 'Emoji';
        emojiBtn.onclick = (e) => {
            e.stopPropagation();
            if (picker) { picker.remove(); picker = null; return; }
            picker = document.createElement('div');
            picker.id = 'chatEmojiPicker';
            for (const emoji of EMOJIS) {
                const btn = document.createElement('button');
                btn.className   = 'chat-emoji-option';
                btn.textContent = emoji;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    gameServices.socketHandler.sendChatMessage(emoji);
                    close();
                };
                picker.appendChild(btn);
            }
            bar.appendChild(picker);
        };

        // — Text input —
        const input = document.createElement('input');
        input.maxLength   = 64;
        input.placeholder = 'Send a message...';

        bar.append(emojiBtn, input);
        this.divMenu.appendChild(bar);
        requestAnimationFrame(() => input.focus());

        const close = () => {
            if (picker) { picker.remove(); picker = null; }
            inputSystem.disabled = false;
            if (!cursorWasVisible) { cursorSystem.hideCursor(); }
            bar.remove();
        };

        const send = () => {
            const text = input.value.trim();
            if (text) { gameServices.socketHandler.sendChatMessage(text); }
            close();
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')  { e.stopPropagation(); send(); }
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        });

        setTimeout(() => {
            document.addEventListener('click', function onOutside(e) {
                if (!bar.contains(e.target)) { close(); document.removeEventListener('click', onOutside); }
            });
        }, 0);
    }

    showChatBubble(userId, message) {
        const users = gameServices.users;
        const user  = gameServices.user;
        const targetUser = userId === user.id ? user : users[userId];
        if (!targetUser) return;

        const roomPanel = document.getElementById('roomPanel');
        if (!roomPanel) return;

        let chatLog = document.getElementById('chatLog');
        if (!chatLog) {
            chatLog = document.createElement('div');
            chatLog.id = 'chatLog';
            roomPanel.appendChild(chatLog);
        }

        // Drop oldest entry when at limit
        while (chatLog.children.length >= 4) { chatLog.lastChild?.remove(); }

        const COLORS = ['#d94f4f', '#4f8ad9', '#c9b93a', '#4fc97a'];
        const color = COLORS[Math.min(targetUser.loginOrder - 1, 3)];
        const isEmojiOnly = [...message.trim()].every(ch => ch.codePointAt(0) > 127);

        const entry = document.createElement('div');
        entry.className = isEmojiOnly ? 'chat-log-entry chat-log-entry-emoji' : 'chat-log-entry';

        const dot = document.createElement('span');
        dot.className = 'chat-log-dot';
        dot.style.background = color;

        const text = document.createElement('span');
        text.className = isEmojiOnly ? 'chat-log-text chat-log-emoji' : 'chat-log-text';
        text.textContent = message;

        entry.append(dot, text);
        chatLog.prepend(entry);

        setTimeout(() => {
            if (!entry.isConnected) return;
            entry.classList.add('chat-log-fade');
            entry.addEventListener('animationend', () => {
                entry.remove();
                if (chatLog.children.length === 0) { chatLog.remove(); }
            }, { once: true });
        }, 4500);
    }

    _mmBtn(text, onclick) {
        const btn = document.createElement('button');
        btn.className = 'mm-btn';
        btn.textContent = text;
        btn.onclick = onclick;
        return btn;
    }

    // ===== Room error =====

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

        const chooseMapMenu = document.createElement('div');
        chooseMapMenu.id = 'chooseMapMenu';
        this.divMenu.appendChild(chooseMapMenu);

        const title = document.createElement('div');
        title.id = 'chooseMapMenu-title';
        title.textContent = 'VOTE FOR MAP';
        chooseMapMenu.appendChild(title);

        const mapsContainer = document.createElement('div');
        mapsContainer.id = 'chooseMapMenu-maps';
        chooseMapMenu.appendChild(mapsContainer);

        const closeMapMenu = () => {
            if (this.divMenu.contains(chooseMapMenu)) {
                this.divMenu.removeChild(chooseMapMenu);
            }
            document.removeEventListener('click', onOutsideClick);
            window.removeEventListener('keydown', onEscapeKey);
            gameServices.cursorSystem.hideCursor();
        };
        const onOutsideClick = (event) => {
            if (!chooseMapMenu.contains(event.target)) { closeMapMenu(); }
        };
        const onEscapeKey = (event) => {
            if (event.key === 'Escape') { closeMapMenu(); }
        };

        const forestButton = document.createElement('button');
        forestButton.className = 'map-vote-btn';

        const forestIcon = document.createElement('div');
        forestIcon.className = 'map-vote-btn-icon';
        forestIcon.style.backgroundImage = 'url(assets/textures/maps/forest/icon.png)';
        forestButton.appendChild(forestIcon);

        const forestLabel = document.createElement('span');
        forestLabel.textContent = 'Forest';
        forestButton.appendChild(forestLabel);

        forestButton.addEventListener('click', () => {
            const user = gameServices.user;
            user.chooseMap.current = 'forest';
            gameServices.mapSystem.vote(user.chooseMap);
            gameServices.socketHandler.sendChooseMap();
            user.chooseMap.previous = user.chooseMap.current;
            closeMapMenu();
        });
        mapsContainer.appendChild(forestButton);

        setTimeout(() => { document.addEventListener('click', onOutsideClick); }, 0);
        window.addEventListener('keydown', onEscapeKey);
    }

    updateVoteUI({ map, number }) {
        const roomPanel = document.getElementById('roomPanel');

        let voteUI = document.getElementById('voteUI');
        if (!voteUI) {
            voteUI = document.createElement('div');
            voteUI.id = 'voteUI';
            (roomPanel || this.divMenu).appendChild(voteUI);
        }

        const users = gameServices.users;
        const numberOfPlayers = Object.keys(users).length;
        let voteRow = document.getElementById('voteUI-' + map);

        if (!voteRow) {
            voteRow = document.createElement('div');
            voteRow.id = 'voteUI-' + map;
            voteRow.className = 'vote-row';

            const icon = document.createElement('div');
            icon.className = 'vote-row-icon';
            icon.style.backgroundImage = `url(assets/textures/maps/${map}/icon.png)`;
            voteRow.appendChild(icon);

            const name = document.createElement('span');
            name.className = 'vote-row-name';
            name.textContent = map;
            voteRow.appendChild(name);

            const count = document.createElement('span');
            count.className = 'vote-row-count';
            count.textContent = `${number}/${numberOfPlayers}`;
            voteRow.appendChild(count);

            voteUI.appendChild(voteRow);
        } else {
            if (number === 0) {
                voteUI.removeChild(voteRow);
                if (!voteUI.hasChildNodes()) { voteUI.remove(); }
            } else {
                voteRow.querySelector('.vote-row-count').textContent = `${number}/${numberOfPlayers}`;
            }
        }
    }

    // ===== Scoreboard =====

    showScoreBoard() {
        document.getElementById('scoreBoard')?.remove();
        const user = gameServices.user;
        const users = gameServices.users;
        const player = gameServices.player;
        const previousScores = gameServices.previousScores;

        const scoreBoard = document.createElement('div');
        scoreBoard.id = 'scoreBoard';
        this.divMenu.appendChild(scoreBoard);
        scoreBoard.style.animation = 'scoreboard-enter 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) forwards';

        const title = document.createElement('div');
        title.id = 'scoreBoard-title';
        title.textContent = 'RESULTS';
        scoreBoard.appendChild(title);

        // Collect all player entries
        const entries = [];
        entries.push({
            userId: user.id,
            icon: player.characterOption
                ? `assets/textures/characters/${player.characterOption.id}/icon.png`
                : 'assets/textures/characters/blueCat/icon.png',
            label: 'YOU',
            victories: user.points.victories
        });
        for (let id in users) {
            if (id === user.id) continue;
            const remotePlayer = users[id].remotePlayer;
            entries.push({
                userId: id,
                icon: remotePlayer && remotePlayer.characterId
                    ? `assets/textures/characters/${remotePlayer.characterId}/icon.png`
                    : 'assets/textures/characters/blueCat/icon.png',
                label: '',
                victories: users[id].points.victories
            });
        }

        // Sort by victories descending
        entries.sort((a, b) => b.victories - a.victories);

        const rankLabels  = ['1ST', '2ND', '3RD', '4TH'];
        const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-4'];

        const rowsContainer = document.createElement('div');
        rowsContainer.className = 'score-rows';
        scoreBoard.appendChild(rowsContainer);

        entries.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'score-row ' + (rankClasses[i] || '');

            const badge = document.createElement('span');
            badge.className = 'rank-badge';
            badge.textContent = rankLabels[i] || `${i + 1}TH`;
            row.appendChild(badge);

            const img = document.createElement('img');
            img.src = entry.icon;
            row.appendChild(img);

            const label = document.createElement('span');
            label.className = 'score-label';
            label.textContent = entry.label;
            row.appendChild(label);

            const points = document.createElement('span');
            points.className = 'score-points';
            const oldScore = previousScores[entry.userId] ?? entry.victories;
            const delta    = entry.victories - oldScore;
            points.textContent = oldScore + ' PTS';
            row.appendChild(points);

            if (delta > 0) {
                const rowDelays = [120, 220, 320, 420];
                const baseDelay = (rowDelays[i] ?? 420) + 400;
                const tickGap   = 380;
                for (let d = 1; d <= delta; d++) {
                    setTimeout(() => {
                        points.textContent = (oldScore + d) + ' PTS';
                        points.style.animation = 'none';
                        void points.offsetHeight;
                        points.style.animation = 'points-tick 0.38s ease-out forwards';
                    }, baseDelay + (d - 1) * tickGap);
                }
            }

            rowsContainer.appendChild(row);
        });

        const noPlayerDied = !player.dead &&
            Object.values(users).every(u => u.id === user.id || !u.localPlayer.dead);
        if (noPlayerDied) {
            const tooEasy = document.createElement('div');
            tooEasy.className = 'too-easy';
            tooEasy.textContent = 'TOO EASY!';
            scoreBoard.appendChild(tooEasy);
        }
    }

    startScoreBoardExit() {
        const all = this.divMenu.querySelectorAll('#scoreBoard');
        if (!all.length) return;

        const ghost = all[0].cloneNode(true);
        all.forEach(el => el.remove());
        this.divMenu.appendChild(ghost);

        ghost.style.animation = 'scoreboard-exit 0.55s cubic-bezier(0.4, 0, 1, 1) forwards';
        ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
    }

    clearVoteUI() {
        const voteUI = document.getElementById('voteUI');
        if (voteUI) voteUI.remove();
    }

    // ===== Hint =====

    showHint(message) {
        if (document.getElementById('hint')) return;
        const div = document.createElement('div');
        div.id = 'hint';
        div.innerHTML = `<span>${message}</span><div class="hint-bar"><div class="hint-bar-fill"></div></div>`;
        this.divMenu.appendChild(div);
        requestAnimationFrame(() => div.classList.add('visible'));
    }

    hideHint() {
        document.getElementById('hint')?.remove();
    }

    updateHintBar(ratio) {
        const fill = document.querySelector('#hint .hint-bar-fill');
        if (fill) { fill.style.width = Math.min(ratio * 100, 100) + '%'; }
    }
}
