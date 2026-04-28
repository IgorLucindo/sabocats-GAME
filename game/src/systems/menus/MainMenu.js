import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { renderContext } from '../../core/RenderContext.js';

export class MainMenu {
    constructor({ divMenu }) {
        this.divMenu = divMenu;
        this._mainMenuEl              = null;
        this._mainMenuEscHandler      = null;
        this._mainMenuClickOutHandler = null;
        this._cursorWasVisible        = false;
    }

    initialize() {
        this._applyUiScale(gameState.get('settings.uiScale'));
    }

    open() {
        if (document.getElementById('mainMenu')) return;

        gameServices.soundSystem.play('openMenu');
        this._cursorWasVisible = document.body.style.cursor !== 'none';
        gameServices.cursorSystem.showCursor();

        gameServices.cameraSystem.fade(0.3, 0.75);

        const menu = document.createElement('div');
        menu.id = 'mainMenu';
        this.divMenu.appendChild(menu);
        void menu.offsetHeight; // force reflow so initial state is committed before transition
        menu.classList.add('open');
        gameServices.menuSystem.updatePartyPanel();

        this._mainMenuEl = menu;
        menu.addEventListener('click', (e) => e.stopPropagation());
        this._renderRoot();

        this._mainMenuEscHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        window.addEventListener('keydown', this._mainMenuEscHandler);

        this._mainMenuClickOutHandler = () => this.close();
        document.addEventListener('click', this._mainMenuClickOutHandler);
    }

    close() {
        const menu = document.getElementById('mainMenu');
        if (!menu) return;

        this._hideKeyboardFloat();

        gameServices.cameraSystem.fade(0.3, 1);

        gameServices.soundSystem.play('closeMenu');
        menu.classList.remove('open');
        menu.addEventListener('transitionend', () => {
            menu.remove();
            gameServices.menuSystem.updatePartyPanel();
        }, { once: true });

        window.removeEventListener('keydown', this._mainMenuEscHandler);
        document.removeEventListener('click', this._mainMenuClickOutHandler);

        if (!this._cursorWasVisible) { gameServices.cursorSystem.hideCursor(); }
    }

    get isOpen() { return !!document.getElementById('mainMenu'); }

    _applyUiScale(v) {
        document.documentElement.style.setProperty('--ui-scale', v);
    }

    // ===== Submenus =====

    _renderRoot() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Menu';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const resume   = this._mmBtn('Resume',    () => this.close(), null);
        const joinRoom = this._mmBtn('Join Room', () => this._renderJoinRoom());
        const controls = this._mmBtn('Controls',  () => this._renderControls());
        const visuals  = this._mmBtn('Visuals',   () => this._renderVisuals());
        const settings = this._mmBtn('Settings',  () => this._renderSettings());
        const leave    = this._mmBtn('Leave',     () => window.location.reload());
        leave.classList.add('mm-btn-danger');

        panel.append(resume, joinRoom, controls, visuals, settings, leave);
        this._clearMenu();
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

        const back = this._mmBtn('Back', () => this._renderRoot(), 'closeMenu');
        back.classList.add('mm-btn-back');

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
                this.close();
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') joinBtn.click();
        });

        const inputRow = document.createElement('div');
        inputRow.className = 'mm-input-row';
        inputRow.append(input, joinBtn);
        inputSection.append(inputLabel, inputRow);

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
                        this.close();
                    };

                    row.append(code, count, joinRowBtn);
                    listEl.appendChild(row);
                }
            });
        };

        refreshBtn.onclick = fetchRooms;
        listSection.append(listHeader, listEl);

        panel.append(back, inputSection, listSection);
        this._clearMenu();
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

        const back = this._mmBtn('Back', () => this._renderRoot(), 'closeMenu');
        back.classList.add('mm-btn-back');

        const section = document.createElement('div');
        section.className = 'mm-section';

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
            gameState.saveSettings();
        };

        applyState(gameState.get('settings.vignette'));
        vignetteRow.onclick = () => applyState(!gameState.get('settings.vignette'));
        vignetteRow.append(rowLabel, indicator);

        const shakeRow = document.createElement('button');
        shakeRow.className = 'mm-toggle-row';

        const shakeLabel = document.createElement('span');
        shakeLabel.textContent = 'Screen Shake';

        const shakeIndicator = document.createElement('span');
        shakeIndicator.className = 'mm-toggle-indicator';

        const applyShakeState = (on) => {
            shakeIndicator.textContent = on ? 'ON' : 'OFF';
            shakeIndicator.classList.toggle('mm-toggle-on', on);
            gameState.set('settings.screenShake', on);
            gameState.saveSettings();
        };

        applyShakeState(gameState.get('settings.screenShake'));
        shakeRow.onclick = () => applyShakeState(!gameState.get('settings.screenShake'));
        shakeRow.append(shakeLabel, shakeIndicator);

        const smoothZoomRow = document.createElement('button');
        smoothZoomRow.className = 'mm-toggle-row';

        const smoothZoomLabel = document.createElement('span');
        smoothZoomLabel.textContent = 'Smooth Zoom';

        const smoothZoomIndicator = document.createElement('span');
        smoothZoomIndicator.className = 'mm-toggle-indicator';

        const applySmoothZoom = (on) => {
            smoothZoomIndicator.textContent = on ? 'ON' : 'OFF';
            smoothZoomIndicator.classList.toggle('mm-toggle-on', on);
            renderContext.setSmoothZoom(on);
            gameState.set('settings.smoothZoom', on);
            gameState.saveSettings();
        };

        applySmoothZoom(gameState.get('settings.smoothZoom'));
        smoothZoomRow.onclick = () => applySmoothZoom(!gameState.get('settings.smoothZoom'));
        smoothZoomRow.append(smoothZoomLabel, smoothZoomIndicator);

        this._setupButtonSounds(vignetteRow);
        this._setupButtonSounds(shakeRow);
        this._setupButtonSounds(smoothZoomRow);

        section.append(vignetteRow, shakeRow, smoothZoomRow);

        const uiSection = document.createElement('div');
        uiSection.className = 'mm-section mm-slider-section';
        uiSection.addEventListener('mouseenter', () => gameServices.soundSystem.play('hoverButton'));

        const uiLabel = document.createElement('div');
        uiLabel.className = 'mm-label';
        uiLabel.textContent = 'UI Scale';

        const currentUiScale = gameState.get('settings.uiScale');

        const uiSliderRow = document.createElement('div');
        uiSliderRow.className = 'mm-slider-row';

        const uiSlider = document.createElement('input');
        uiSlider.type  = 'range';
        uiSlider.className = 'mm-slider';
        uiSlider.min   = 0.5;
        uiSlider.max   = 2;
        uiSlider.step  = 0.05;
        uiSlider.value = currentUiScale;

        const uiValueDisplay = document.createElement('span');
        uiValueDisplay.className = 'mm-slider-value';
        uiValueDisplay.textContent = Math.round(currentUiScale * 100) + '%';

        uiSlider.oninput = () => {
            uiValueDisplay.textContent = Math.round(parseFloat(uiSlider.value) * 100) + '%';
        };

        uiSlider.onchange = () => {
            const v = parseFloat(uiSlider.value);
            gameState.set('settings.uiScale', v);
            uiValueDisplay.textContent = Math.round(v * 100) + '%';
            this._applyUiScale(v);
            gameState.saveSettings();
        };

        uiSliderRow.append(uiSlider, uiValueDisplay);
        uiSection.append(uiLabel, uiSliderRow);

        panel.append(back, section, uiSection);
        this._clearMenu();
        menu.append(title, panel);
    }

    _renderSettings() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Settings';

        const panel = document.createElement('div');
        panel.className = 'mm-panel';

        const back = this._mmBtn('Back', () => this._renderRoot(), 'closeMenu');
        back.classList.add('mm-btn-back');

        const section = document.createElement('div');
        section.className = 'mm-section mm-slider-section';
        section.addEventListener('mouseenter', () => gameServices.soundSystem.play('hoverButton'));

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
            gameState.saveSettings();
        };

        sliderRow.append(slider, valueDisplay);
        section.append(label, sliderRow);
        panel.append(back, section);
        this._clearMenu();
        menu.append(title, panel);
    }

    _renderControls() {
        const menu = this._mainMenuEl;

        const title = document.createElement('div');
        title.className = 'mm-title';
        title.textContent = 'Controls';

        const panel = document.createElement('div');
        panel.className = 'mm-panel mm-controls-panel';

        const back = this._mmBtn('Back', () => this._renderRoot(), 'closeMenu');
        back.classList.add('mm-btn-back');

        const SECTIONS = [
            {
                title: 'Movement',
                bindings: [
                    { key: 'w',     label: 'Slow wallslide / look up' },
                    { key: 'a',     label: 'Move left' },
                    { key: 's',     label: 'Look down' },
                    { key: 'd',     label: 'Move right' },
                    { key: 'space', label: 'Jump' },
                    { key: 'shift', label: 'Sprint' },
                ],
            },
            {
                title: 'Actions',
                bindings: [
                    { key: 'q',     label: 'Previous player' },
                    { key: 'e',     label: 'Next player' },
                    { key: 'r',     label: 'Rotate object' },
                    { key: 'g',     label: 'Give up' },
                    { key: 'esc',   label: 'Menu' },
                    { key: 'enter', label: 'Chat' },
                ],
            },
        ];

        const keyEls = {};  // key id → [keyboard div elements]
        const rowEls = {};  // key id → [list row elements]

        const setHL = (id, on) => {
            (keyEls[id] || []).forEach(el => el.classList.toggle('mm-key-hl', on));
            (rowEls[id] || []).forEach(el => el.classList.toggle('mm-ctrl-row-hl', on));
        };

        // --- Bindings list ---
        const keySprites = new Set(
            SECTIONS.flatMap(section => section.bindings.map(binding => binding.key))
        );
        const P = 'assets/textures/keys/keyboard/';

        const listEl = document.createElement('div');
        listEl.className = 'mm-controls-list';

        for (const { title: sectionTitle, bindings } of SECTIONS) {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'mm-ctrl-section';
            sectionEl.textContent = sectionTitle;
            listEl.appendChild(sectionEl);

            for (const { key, label } of bindings) {
                const row = document.createElement('div');
                row.className = 'mm-ctrl-row';

                const badge = document.createElement('span');
                badge.className = 'mm-ctrl-badge';
                if (keySprites.has(key)) {
                    const img = document.createElement('img');
                    img.src = P + key + '.png';
                    img.className = 'mm-ctrl-badge-img';
                    img.draggable = false;
                    badge.appendChild(img);
                } else {
                    badge.textContent = key.toUpperCase();
                    badge.classList.add('mm-ctrl-badge-text');
                }

                const lbl = document.createElement('span');
                lbl.className = 'mm-ctrl-label';
                lbl.textContent = label;

                row.append(badge, lbl);

                if (!rowEls[key]) rowEls[key] = [];
                rowEls[key].push(row);
                row.addEventListener('mouseenter', () => {
                    gameServices.soundSystem.play('hoverButton');
                    setHL(key, true);
                });
                row.addEventListener('mouseleave', () => setHL(key, false));

                listEl.appendChild(row);
            }
        }

        panel.append(back, listEl);
        this._clearMenu();
        menu.append(title, panel);
        this._showKeyboardFloat(keyEls, keySprites, setHL);
    }

    _showKeyboardFloat(keyEls, keySprites, setHL) {
        // Update highlight fn each render (rowEls change, keyboard DOM does not)
        this._kfSetHL = setHL;

        if (this._kfWrapper) {
            // Reuse cached keyboard — copy stored key element refs into keyEls
            Object.assign(keyEls, this._kfKeyEls);
            // Clear any leftover hide state in case of rapid navigation
            this._kfWrapper.classList.remove('mm-kf-hiding');
            this._kfWrapper.style.cssText = '';
            this._mainMenuEl.appendChild(this._kfWrapper);
            return;
        }

        // Build once
        const P = 'assets/textures/keys/keyboard/';
        this._kfKeyEls = {};

        const makeKey = (id) => {
            const wrap = document.createElement('div');
            wrap.className = 'mm-kf-key';
            if (keySprites.has(id)) {
                wrap.classList.add('mm-kf-active');
                if (!this._kfKeyEls[id]) this._kfKeyEls[id] = [];
                this._kfKeyEls[id].push(wrap);
                wrap.addEventListener('mouseenter', () => {
                    gameServices.soundSystem.play('hoverButton');
                    this._kfSetHL?.(id, true);
                });
                wrap.addEventListener('mouseleave', () => this._kfSetHL?.(id, false));
            } else {
                wrap.classList.add('mm-kf-dim');
            }
            const img = document.createElement('img');
            img.src = P + id + '.png';
            img.className = 'mm-kf-img';
            img.draggable = false;
            wrap.appendChild(img);
            return wrap;
        };

        // Layout rows — each cell is one of:
        //   'keyId'  → key image (assets/textures/keys/keyboard/<keyId>.png)
        //   '$N'     → spacer of exactly N px
        //   '>'      → flex-grow spacer (pushes remaining keys to the right)
        const layout = [
            ['esc'],
            ['$72','1','2','3','4','5','6','7','8','9','0','backspace'],
            ['$96','q','w','e','r','t','y','u','i','o','p'],
            ['capslock','a','s','d','f','g','h','j','k','l','enter'],
            ['$51','shift','z','x','c','v','b','n','m','$80','arrowUp'],
            ['ctrl','alt','space','$75','arrowLeft','arrowDown','arrowRight']
        ];

        const kf = document.createElement('div');
        kf.className = 'mm-kf-inner';

        for (const row of layout) {
            const rowEl = document.createElement('div');
            rowEl.className = 'mm-kf-row';
            for (const cell of row) {
                if (cell === '>') {
                    const spacer = document.createElement('div');
                    spacer.style.flex = '1';
                    rowEl.appendChild(spacer);
                } else if (cell.startsWith('$')) {
                    const spacer = document.createElement('div');
                    spacer.style.width = cell.slice(1) + 'px';
                    rowEl.appendChild(spacer);
                } else {
                    rowEl.appendChild(makeKey(cell));
                }
            }
            kf.appendChild(rowEl);
        }

        this._kfWrapper = document.createElement('div');
        this._kfWrapper.id = 'mm-keyboard-float';
        this._kfWrapper.appendChild(kf);

        // Wait for images on first build so the appear animation starts clean
        const token = Symbol();
        this._kfToken = token;
        const imgs = [...this._kfWrapper.querySelectorAll('img')];
        Promise.all(imgs.map(img => new Promise(res => {
            if (img.complete) res();
            else { img.onload = res; img.onerror = res; }
        }))).then(() => {
            if (this._kfToken !== token) return;
            Object.assign(keyEls, this._kfKeyEls);
            this._mainMenuEl.appendChild(this._kfWrapper);
        });
    }

    _clearMenu() {
        this._hideKeyboardFloat();
        this._mainMenuEl.innerHTML = '';
    }

    _hideKeyboardFloat() {
        this._kfToken = null;
        this._kfSetHL = null;
        const el = this._mainMenuEl?.querySelector('#mm-keyboard-float');
        if (!el) return;
        // Reparent to body so _clearMenu's innerHTML = '' doesn't kill it mid-animation
        const rect = el.getBoundingClientRect();
        el.style.position = 'fixed';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        document.body.appendChild(el);
        void el.offsetWidth;
        el.classList.add('mm-kf-hiding');
        el.addEventListener('animationend', () => {
            el.remove();
            el.classList.remove('mm-kf-hiding');
            el.style.cssText = ''; // reset inline styles for reuse
        }, { once: true });
    }

    // ===== Helpers =====

    _mmBtn(text, onclick, sound = 'clickButton') {
        const btn = document.createElement('button');
        btn.className = 'mm-btn';
        btn.textContent = text;
        btn.onclick = onclick;
        this._setupButtonSounds(btn, sound);
        return btn;
    }

    _setupButtonSounds(btn, sound = 'clickButton') {
        btn.addEventListener('mouseenter', () => gameServices.soundSystem.play('hoverButton'));
        const originalOnclick = btn.onclick;
        btn.onclick = () => {
            if (sound) gameServices.soundSystem.play(sound);
            if (originalOnclick) originalOnclick.call(btn);
        };
    }
}
