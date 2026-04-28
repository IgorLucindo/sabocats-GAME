import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { data } from '../../core/DataLoader.js';

function getDisplayName(user, charId) {
    if (user.name) return user.name;
    else if (charId) return data.characters[charId].name;
    return '';
}

export class RoomPanel {
    constructor({ divMenu }) {
        this.divMenu           = divMenu;
        this._iconStates       = {};
        this._escHandler       = null;
        this._chatEnterHandler = null;
    }

    show(openMainMenu, openChatInput) {
        if (document.getElementById('roomPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'roomPanel';
        this.divMenu.appendChild(panel);

        this._escHandler = (e) => {
            if (e.key === 'Escape' && !document.getElementById('mainMenu')) {
                openMainMenu();
            }
        };
        window.addEventListener('keydown', this._escHandler);

        this._chatEnterHandler = (e) => {
            if (e.key === 'Enter' && !document.getElementById('mainMenu') && !document.getElementById('chatInputBar')) {
                openChatInput();
            }
        };
        window.addEventListener('keydown', this._chatEnterHandler);
    }

    update() {
        const panel = document.getElementById('roomPanel');
        if (!panel) return;

        const { users, user, player, gameConfig } = gameServices;
        const room = gameState.get('room');
        const maxPlayers = gameConfig.room.maxPlayers;

        const voteUI = document.getElementById('voteUI');
        panel.innerHTML = '';

        const slots = document.createElement('div');
        slots.className = 'room-slots';

        for (let i = 1; i <= maxPlayers; i++) {
            const slotUser = Object.values(users).find(u => u.loginOrder === i);
            const wrapper = document.createElement('div');
            wrapper.className = 'room-slot-wrapper';

            const slot = document.createElement('div');
            slot.className = 'room-slot';

            if (!slotUser) {
                slot.classList.add('open');
                slot.textContent = '+';
            } else {
                const isLocal  = slotUser.id === user.id;
                const isLoaded = isLocal ? player.loaded : slotUser.remotePlayer.loaded;
                const charId   = isLocal ? user.localPlayer.id : slotUser.remotePlayer.characterId;
                const inMatch  = gameServices.matchStateMachine.getState() !== 'lobby';

                const displayCharId = (inMatch || isLoaded) ? charId : null;

                if (charId && (inMatch || isLoaded)) {
                    slot.classList.add('filled');
                    const img = document.createElement('img');

                    const entity = isLocal ? player : slotUser.remotePlayer;
                    const charData = data.characters[charId];
                    const deathType = entity?.deathType || 'default';
                    let iconState, iconSrc;

                    if (inMatch && entity?.dead) {
                        iconState = `dead.${deathType}`;
                        iconSrc   = charData.icons.dead[deathType];
                    } else if (inMatch && entity?.finished) {
                        iconState = 'finished';
                        iconSrc   = charData.icons.finished;
                    } else {
                        iconState = 'default';
                        iconSrc   = charData.icons.default;
                    }
                    img.src = iconSrc;

                    const userId = slotUser.id;
                    if (this._iconStates[userId] !== iconState) {
                        img.classList.add(
                            iconState.startsWith('dead') ? 'icon-anim-dead'
                            : iconState === 'finished'   ? 'icon-anim-finished'
                            :                              'icon-anim-default'
                        );
                        this._iconStates[userId] = iconState;
                    }

                    slot.appendChild(img);
                } else {
                    slot.classList.add('waiting');
                    const img = document.createElement('img');
                    img.src = 'assets/textures/characters/placeholderCat/icon.png';
                    delete this._iconStates[slotUser.id];
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

                // Name below slot
                wrapper.appendChild(slot);
                if (isLocal && document.getElementById('mainMenu')) {
                    const nameInput = document.createElement('input');
                    nameInput.className = 'room-slot-name-input';
                    nameInput.maxLength = 16;
                    nameInput.placeholder = getDisplayName(user, displayCharId);
                    nameInput.value = user.name;
                    let _nameDebounce = null;
                    nameInput.addEventListener('click',   (e) => e.stopPropagation());
                    nameInput.addEventListener('keydown', (e) => e.stopPropagation());
                    nameInput.addEventListener('keyup',   (e) => e.stopPropagation());
                    nameInput.addEventListener('input', () => {
                        const name = nameInput.value;
                        gameServices.user.name = name;
                        gameState.saveSettings();
                        clearTimeout(_nameDebounce);
                        _nameDebounce = setTimeout(() => gameServices.socketHandler.sendUpdateName(name), 300);
                    });
                    wrapper.appendChild(nameInput);
                } else {
                    const nameLabel = document.createElement('div');
                    nameLabel.className = 'room-slot-name';
                    nameLabel.textContent = getDisplayName(isLocal ? user : slotUser, displayCharId);
                    wrapper.appendChild(nameLabel);
                }
            }

            if (!slotUser) { wrapper.appendChild(slot); }
            slots.appendChild(wrapper);
        }

        panel.appendChild(slots);

        if (voteUI) panel.appendChild(voteUI);
    }

    resetIconStates() { this._iconStates = {}; }

    showError(message) {
        const existing = document.getElementById('roomError');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'roomError';
        el.className = 'room-error';
        el.textContent = message;
        this.divMenu.appendChild(el);

        setTimeout(() => { if (this.divMenu.contains(el)) this.divMenu.removeChild(el); }, 3000);
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
            name.textContent = map.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
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

    clearVoteUI() {
        document.getElementById('voteUI')?.remove();
    }
}
