import { gameServices } from '../../core/GameServices.js';
import { data } from '../../core/DataLoader.js';

export class MapMenu {
    constructor({ divMenu }) {
        this.divMenu              = divMenu;
        this._outsideClickHandler = null;
        this._escapeKeyHandler    = null;
    }

    open() {
        if (document.getElementById('chooseMapMenu')) return;
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

        this._outsideClickHandler = (event) => {
            if (!chooseMapMenu.contains(event.target)) { this.close(); }
        };
        this._escapeKeyHandler = (event) => {
            if (event.key === 'Escape') { this.close(); }
        };

        for (const name of Object.keys(data.maps)) {
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
}
