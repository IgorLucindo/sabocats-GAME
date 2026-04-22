import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { data } from '../../core/DataLoader.js';

export class MapMenu {
    constructor({ divMenu }) {
        this.divMenu              = divMenu;
        this._outsideClickHandler = null;
        this._escapeKeyHandler    = null;
        this._currentView         = 'maps';
        this._transitioning       = false;
    }

    open() {
        if (document.getElementById('chooseMapMenu')) return;
        gameServices.cursorSystem.showCursor();

        const menu = document.createElement('div');
        menu.id = 'chooseMapMenu';
        this.divMenu.appendChild(menu);

        this._currentView   = 'maps';
        this._transitioning = false;
        this._renderView(menu, this._buildMapsContent(), 'none');

        this._outsideClickHandler = (event) => {
            if (!menu.contains(event.target)) { this.close(); }
        };
        this._escapeKeyHandler = (event) => {
            if (event.key === 'Escape') {
                if (this._currentView === 'settings') {
                    this._slideTo(this._buildMapsContent(), 'back');
                } else {
                    this.close();
                }
            }
        };

        setTimeout(() => { document.addEventListener('click', this._outsideClickHandler); }, 0);
        window.addEventListener('keydown', this._escapeKeyHandler);
    }

    close() {
        const menu = document.getElementById('chooseMapMenu');
        if (!menu) return;
        menu.remove();
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
            this._outsideClickHandler = null;
        }
        if (this._escapeKeyHandler) {
            window.removeEventListener('keydown', this._escapeKeyHandler);
            this._escapeKeyHandler = null;
        }
        gameServices.cursorSystem.hideCursor();
    }

    // Called when remote settings update arrives — refresh if settings view is showing
    refreshSettings() {
        if (this._currentView !== 'settings') return;
        const menu = document.getElementById('chooseMapMenu');
        if (!menu) return;
        const ms = gameState.get('room.matchSettings');

        for (const row of menu.querySelectorAll('[data-ms-stepper]')) {
            const v = ms[row.dataset.msStepper];
            row.querySelector('.ms-stepper-value').textContent = v;
        }

        for (const cell of menu.querySelectorAll('[data-ms-object]')) {
            const enabled = ms.enabledObjects[cell.dataset.msObject] !== false;
            cell.classList.toggle('ms-cell-disabled', !enabled);
        }
    }

    // ===== Slide navigation =====

    _slideTo(buildFn, direction) {
        if (this._transitioning) return;
        const menu = document.getElementById('chooseMapMenu');
        if (!menu) return;

        this._transitioning = true;
        const outAnim = direction === 'forward' ? 'map-menu-out-left' : 'map-menu-out-right';
        const inAnim  = direction === 'forward' ? 'map-menu-in-right' : 'map-menu-in-left';

        const current = menu.querySelector('.map-menu-content');
        if (current) {
            current.style.animation = `${outAnim} 0.2s ease forwards`;
            current.addEventListener('animationend', () => {
                menu.innerHTML = '';
                this._renderView(menu, buildFn, inAnim);
                this._transitioning = false;
            }, { once: true });
        } else {
            this._renderView(menu, buildFn, inAnim);
            this._transitioning = false;
        }
    }

    _renderView(menu, buildFn, animName) {
        const wrapper = document.createElement('div');
        wrapper.className = 'map-menu-content';
        if (animName !== 'none') {
            wrapper.style.animation = `${animName} 0.2s ease forwards`;
        }
        buildFn(wrapper);
        menu.appendChild(wrapper);
    }

    // ===== Maps view =====

    _buildMapsContent() {
        return (wrapper) => {
            this._currentView = 'maps';

            const room   = gameState.get('room');
            const isHost = gameServices.user.id === room.hostId;

            const titleRow = document.createElement('div');
            titleRow.className = 'map-menu-title-row';

            const title = document.createElement('div');
            title.id = 'chooseMapMenu-title';
            title.textContent = 'VOTE FOR MAP';
            titleRow.appendChild(title);

            const cogBtn = document.createElement('button');
            cogBtn.className = 'map-menu-cog-btn';
            const cogImg = document.createElement('img');
            cogImg.src = 'assets/textures/misc/cog.png';
            cogImg.draggable = false;
            cogBtn.appendChild(cogImg);
            cogBtn.disabled = !isHost;
            cogBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._slideTo(this._buildSettingsContent(), 'forward');
            });
            titleRow.appendChild(cogBtn);
            wrapper.appendChild(titleRow);

            const mapsContainer = document.createElement('div');
            mapsContainer.id = 'chooseMapMenu-maps';
            wrapper.appendChild(mapsContainer);

            for (const name of Object.keys(data.maps)) {
                if (name === 'lobby') continue;

                const btn = document.createElement('button');
                btn.className = 'map-vote-btn';

                const icon = document.createElement('div');
                icon.className = 'map-vote-btn-icon';
                icon.style.backgroundImage = `url(assets/textures/maps/${name}/icon.png)`;
                btn.appendChild(icon);

                const label = document.createElement('span');
                label.textContent = name.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
                btn.appendChild(label);

                btn.addEventListener('click', () => {
                    const user = gameServices.user;
                    user.chooseMap.current = name;
                    gameServices.mapSystem.vote(user.chooseMap);
                    gameServices.socketHandler.sendChooseMap();
                    user.chooseMap.previous = user.chooseMap.current;
                    this.close();
                });
                mapsContainer.appendChild(btn);
            }

        };
    }

    // ===== Settings view =====

    _buildSettingsContent() {
        return (wrapper) => {
            this._currentView = 'settings';

            const room    = gameState.get('room');
            const isHost  = gameServices.user.id === room.hostId;
            const ms      = gameState.get('room.matchSettings');

            const header = document.createElement('div');
            header.className = 'map-menu-settings-header';

            const backBtn = document.createElement('button');
            backBtn.className = 'map-menu-back-btn';
            backBtn.textContent = '←';
            backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._slideTo(this._buildMapsContent(), 'back');
            });
            header.appendChild(backBtn);

            const title = document.createElement('div');
            title.id = 'chooseMapMenu-title';
            title.textContent = 'MATCH SETTINGS';
            header.appendChild(title);

            wrapper.appendChild(header);

            if (!isHost) {
                const note = document.createElement('div');
                note.className = 'ms-readonly-note';
                note.textContent = 'Only the host can change settings';
                wrapper.appendChild(note);
            }

            const body = document.createElement('div');
            body.className = 'map-menu-settings-body';

            // Points to win stepper
            body.appendChild(this._stepper({
                key: 'pointsToWin',
                label: 'Points to Win',
                value: ms.pointsToWin,
                min: 1, max: 20,
                disabled: !isHost,
                onChange: (v) => this._updateSetting('pointsToWin', v)
            }));

            // Lives stepper
            body.appendChild(this._stepper({
                key: 'lives',
                label: 'Lives',
                value: ms.lives,
                min: 1, max: 5,
                disabled: !isHost,
                onChange: (v) => this._updateSetting('lives', v)
            }));

            // Object toggles
            const objSection = document.createElement('div');
            objSection.className = 'ms-section';

            const objLabel = document.createElement('div');
            objLabel.className = 'ms-section-label';
            objLabel.textContent = 'Objects';
            objSection.appendChild(objLabel);

            const objGrid = document.createElement('div');
            objGrid.className = 'ms-objects-grid';

            for (const [id, objData] of Object.entries(data.placeableObjects)) {
                if ((objData.weight ?? 1) <= 0) continue;

                const enabled = ms.enabledObjects[id] !== false;

                const cell = document.createElement('button');
                cell.className = 'ms-object-cell' + (enabled ? '' : ' ms-cell-disabled');
                cell.disabled = !isHost;
                cell.dataset.msObject = id;

                const inner = document.createElement('div');
                inner.className = 'ms-cell-inner';

                const img = document.createElement('img');
                img.src = objData.animations.default.texture;
                inner.appendChild(img);

                if (objData.objectAttachmentId) {
                    const attData = data.objectAttachments[objData.objectAttachmentId];
                    if (attData) {
                        const attImg = document.createElement('img');
                        attImg.src = attData.animations.default.texture;
                        attImg.className = 'ms-attachment-img';

                        const positionAttachment = () => {
                            if (!img.naturalWidth || !attImg.naturalWidth) return;
                            const pixelFrac    = 1 / img.naturalWidth;
                            const objRenderH   = img.naturalHeight * pixelFrac;
                            const objRenderTop = (1 - objRenderH) / 2;
                            const tileFrac     = 1 / objData.width;
                            const attW  = attImg.naturalWidth  * pixelFrac;
                            const attH  = attImg.naturalHeight * pixelFrac;
                            const attLeft = attData.relativePosition.x * tileFrac;
                            const attTop  = objRenderTop + attData.relativePosition.y * tileFrac;
                            attImg.style.width  = `${attW * 100}%`;
                            attImg.style.height = `${attH * 100}%`;
                            attImg.style.left   = `${attLeft * 100}%`;
                            attImg.style.top    = `${attTop * 100}%`;
                        };
                        img.addEventListener('load', positionAttachment, { once: true });
                        attImg.addEventListener('load', positionAttachment, { once: true });
                        if (img.complete && attImg.complete) positionAttachment();

                        inner.appendChild(attImg);
                    }
                }

                cell.appendChild(inner);

                if (isHost) {
                    cell.addEventListener('click', () => {
                        const current = gameState.get('room.matchSettings');
                        const nowEnabled = current.enabledObjects[id] !== false;
                        const updated = {
                            ...current,
                            enabledObjects: { ...current.enabledObjects, [id]: !nowEnabled }
                        };
                        gameState.set('room.matchSettings', updated);
                        gameServices.socketHandler.sendMatchSettings(updated);
                        cell.classList.toggle('ms-cell-disabled', nowEnabled);
                    });
                }

                objGrid.appendChild(cell);
            }

            objSection.appendChild(objGrid);
            body.appendChild(objSection);
            wrapper.appendChild(body);
        };
    }

    // ===== Helpers =====

    _stepper({ key, label, value, min, max, disabled, onChange }) {
        const row = document.createElement('div');
        row.className = 'ms-stepper-row';
        if (key) row.dataset.msStepper = key;

        const labelEl = document.createElement('span');
        labelEl.className = 'ms-stepper-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const controls = document.createElement('div');
        controls.className = 'ms-stepper-controls';

        const decBtn = document.createElement('button');
        decBtn.className = 'ms-stepper-btn';
        decBtn.textContent = '−';
        decBtn.disabled = disabled || value <= min;

        const valueEl = document.createElement('span');
        valueEl.className = 'ms-stepper-value';
        valueEl.textContent = value;

        const incBtn = document.createElement('button');
        incBtn.className = 'ms-stepper-btn';
        incBtn.textContent = '+';
        incBtn.disabled = disabled || value >= max;

        if (!disabled) {
            decBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const v = parseInt(valueEl.textContent) - 1;
                if (v < min) return;
                valueEl.textContent = v;
                decBtn.disabled = v <= min;
                incBtn.disabled = v >= max;
                onChange(v);
            });
            incBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const v = parseInt(valueEl.textContent) + 1;
                if (v > max) return;
                valueEl.textContent = v;
                decBtn.disabled = v <= min;
                incBtn.disabled = v >= max;
                onChange(v);
            });
        }

        controls.append(decBtn, valueEl, incBtn);
        row.appendChild(controls);
        return row;
    }

    _updateSetting(key, value) {
        const current = gameState.get('room.matchSettings');
        const updated = { ...current, [key]: value };
        gameState.set('room.matchSettings', updated);
        gameServices.socketHandler.sendMatchSettings(updated);
    }
}
