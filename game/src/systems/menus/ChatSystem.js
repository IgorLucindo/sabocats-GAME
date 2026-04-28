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

export class ChatSystem {
    constructor({ divMenu }) {
        this.divMenu           = divMenu;
        this._chatHistory      = [];
        this._chatHistoryPanel = null;
    }

    openInput() {
        const cursorSystem     = gameServices.cursorSystem;
        const inputSystem      = gameServices.inputSystem;
        const cursorWasVisible = document.body.style.cursor !== 'none';

        cursorSystem.showCursor();
        inputSystem.disabled = true;
        for (const key in inputSystem.keys) { inputSystem.keys[key].pressed = false; }

        const wrapper = document.createElement('div');
        wrapper.id = 'chatWrapper';

        const historyPanel = document.createElement('div');
        historyPanel.id = 'chatHistoryPanel';
        for (const msg of this._chatHistory) {
            historyPanel.appendChild(this._buildEntry(msg));
        }
        wrapper.appendChild(historyPanel);
        this._chatHistoryPanel = historyPanel;

        const bar = document.createElement('div');
        bar.id = 'chatInputBar';

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

        const input = document.createElement('input');
        input.maxLength   = 64;
        input.placeholder = 'Send a message...';

        bar.append(emojiBtn, input);
        wrapper.appendChild(bar);
        this.divMenu.appendChild(wrapper);

        requestAnimationFrame(() => {
            input.focus();
            historyPanel.scrollTop = historyPanel.scrollHeight;
        });

        const close = () => {
            if (picker) { picker.remove(); picker = null; }
            inputSystem.disabled = false;
            this._chatHistoryPanel = null;
            if (cursorWasVisible) { cursorSystem.showCursor(); }
            else { cursorSystem.hideCursor(); }
            wrapper.remove();
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

        const divMenu = this.divMenu;
        setTimeout(() => {
            document.addEventListener('click', function onOutside(e) {
                if (!divMenu.contains(e.target)) { close(); document.removeEventListener('click', onOutside); }
            });
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
