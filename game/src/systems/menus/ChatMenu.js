import { gameServices } from '../../core/GameServices.js';
import { data } from '../../core/DataLoader.js';

function getDisplayName(user) {
    if (user.name) return user.name;
    const isLocal = user === gameServices.user;
    const charId  = isLocal ? user.localPlayer.id : user.remotePlayer.characterId;
    const charName = charId ? data.characters[charId].name : null;
    if (charName) return charName;
    return ``;
}

export class ChatMenu {
    constructor({ divMenu }) {
        this.divMenu           = divMenu;
        this._chatHistory      = [];
        this._chatHistoryPanel = null;
        this._chatWrapper      = null;
        this._emojiPicker      = null;
    }

    get isInputOpen() { 
        return !!this._chatWrapper; 
    }

    closeInput() {
        if (!this._chatWrapper) return;
        if (this._emojiPicker) { 
            this._emojiPicker.remove(); 
            this._emojiPicker = null; 
        }
        this._chatWrapper.remove();
        this._chatWrapper = null;
        this._chatHistoryPanel = null;
        gameServices.inputSystem.disabled = false;
    }

    openInput() {
        if (this.isInputOpen) return;

        const inputSystem = gameServices.inputSystem;
        inputSystem.disabled = true;
        for (const key in inputSystem.keys) { inputSystem.keys[key].pressed = false; }

        this._chatWrapper = document.createElement('div');
        this._chatWrapper.id = 'chatWrapper';

        const historyPanel = document.createElement('div');
        historyPanel.id = 'chatHistoryPanel';
        for (const msg of this._chatHistory) {
            historyPanel.appendChild(this._buildEntry(msg));
        }
        this._chatWrapper.appendChild(historyPanel);
        this._chatHistoryPanel = historyPanel;

        const bar = document.createElement('div');
        bar.id = 'chatInputBar';

        const EMOJIS = ['😂','😎','🤔','😭','😡','💀','🤡'];

        const emojiBtn = document.createElement('button');
        emojiBtn.id    = 'chatEmojiBtn';
        emojiBtn.textContent = '💬';
        emojiBtn.title = 'Emoji';
        emojiBtn.onclick = (e) => {
            e.stopPropagation();
            if (this._emojiPicker) { 
                this._emojiPicker.remove(); 
                this._emojiPicker = null; 
                return; 
            }
            
            this._emojiPicker = document.createElement('div');
            this._emojiPicker.id = 'chatEmojiPicker';
            for (const emoji of EMOJIS) {
                const btn = document.createElement('button');
                btn.className   = 'chat-emoji-option';
                btn.textContent = emoji;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    gameServices.socketHandler.sendChatMessage(emoji);
                    this.closeInput();
                };
                this._emojiPicker.appendChild(btn);
            }
            bar.appendChild(this._emojiPicker);
        };

        const input = document.createElement('input');
        input.maxLength   = 64;
        input.placeholder = 'Send a message...';

        bar.append(emojiBtn, input);
        this._chatWrapper.appendChild(bar);
        this.divMenu.appendChild(this._chatWrapper);

        requestAnimationFrame(() => {
            input.focus();
            historyPanel.scrollTop = historyPanel.scrollHeight;
        });

        const send = () => {
            const text = input.value.trim();
            if (text) { gameServices.socketHandler.sendChatMessage(text); }
            this.closeInput();
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                send();
            }
        });

        setTimeout(() => {
            document.addEventListener('click', this._outsideClickHandler);
        }, 0);
    }

    showBubble(userId, message) {
        const users = gameServices.users;
        const user  = gameServices.user;
        const targetUser = userId === user.id ? user : users[userId];
        if (!targetUser) return;

        const COLORS = ['var(--player-red)', 'var(--player-blue)', 'var(--player-yellow)', 'var(--player-green)'];
        const color = COLORS[Math.min(targetUser.loginOrder - 1, 3)];
        const isEmojiOnly = [...message.trim()].every(ch => ch.codePointAt(0) > 127);
        const name = isEmojiOnly ? null : getDisplayName(targetUser);
        const msgData = { color, name, message, isEmojiOnly };

        this._chatHistory.push(msgData);
        if (this._chatHistory.length > 100) { this._chatHistory.shift(); }

        if (this._chatHistoryPanel) {
            this._chatHistoryPanel.appendChild(this._buildEntry(msgData));
            this._chatHistoryPanel.scrollTop = this._chatHistoryPanel.scrollHeight;
        }

        const roomPanel = document.getElementById('roomPanel');
        if (!roomPanel) return;

        if (!document.getElementById('chatLog')) {
            gameServices.soundSystem.play("notification");
        }

        let chatLog = document.getElementById('chatLog');
        if (!chatLog) {
            chatLog = document.createElement('div');
            chatLog.id = 'chatLog';
            roomPanel.appendChild(chatLog);
        }

        while (chatLog.children.length >= 6) { chatLog.lastChild?.remove(); }

        const entry = this._buildEntry(msgData);
        chatLog.prepend(entry);

        setTimeout(() => {
            if (!entry.isConnected) return;
            entry.classList.add('chat-log-fade');
            entry.addEventListener('animationend', () => {
                entry.remove();
                if (chatLog.children.length === 0) { chatLog.remove(); }
            }, { once: true });
        }, 8000);
    }

    clearDomRefs() {
        this._chatHistoryPanel = null;
    }

    _buildEntry({ color, name, message, isEmojiOnly }) {
        const entry = document.createElement('div');
        entry.className = isEmojiOnly ? 'chat-log-entry chat-log-entry-emoji' : 'chat-log-entry';

        const dot = document.createElement('span');
        dot.className = 'chat-log-dot';
        dot.style.background = color;

        if (isEmojiOnly) {
            const text = document.createElement('span');
            text.className = 'chat-log-text chat-log-emoji';
            text.textContent = message;
            entry.append(dot, text);
        } else {
            const nameEl = document.createElement('span');
            nameEl.className = 'chat-log-name';
            nameEl.textContent = name + ':';

            const text = document.createElement('span');
            text.className = 'chat-log-text';
            text.textContent = message;

            entry.append(dot, nameEl, text);
        }

        return entry;
    }
}
