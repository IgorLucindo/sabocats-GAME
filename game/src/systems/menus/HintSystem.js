import { gameState } from '../../core/GameState.js';

export class HintSystem {
    constructor({ divMenu }) {
        this.divMenu = divMenu;
        this._menuHint = null;
    }

    show(message) {
        if (document.getElementById('hint')) return;
        const div = document.createElement('div');
        div.id = 'hint';
        const html = message.replace(/\[(\w+)\]/g, (_, key) =>
            `<img src="assets/textures/keys/keyboard/${key}.png" class="hint-key">`
        );
        div.innerHTML = `<span>${html}</span>`;
        this.divMenu.appendChild(div);
        requestAnimationFrame(() => div.classList.add('visible'));
    }

    showWithBar(message) {
        if (document.getElementById('hint')) return;
        this.show(message);
        document.getElementById('hint').insertAdjacentHTML('beforeend', '<div class="hint-bar"><div class="hint-bar-fill"></div></div>');
    }

    hide() {
        const el = document.getElementById('hint');
        if (!el) return;
        el.classList.remove('visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
    }

    updateBar(ratio) {
        const fill = document.querySelector('#hint .hint-bar-fill');
        if (fill) { fill.style.width = Math.min(ratio * 100, 100) + '%'; }
    }

    showMenuHint(openMenu) {
        if (this._menuHint) return;
        const btn = document.createElement('button');
        btn.id = 'menu-hint';
        if (gameState.get('environment.isTouch')) {
            btn.innerHTML = `<img src="assets/textures/keys/gamepad/menu.png" class="hint-key">`;
            btn.classList.add('menu-hint-touch');
        } else {
            btn.innerHTML = `<img src="assets/textures/keys/keyboard/esc.png" class="hint-key"> MENU`;
            btn.classList.add('menu-hint-desktop');
        }
        btn.onclick = (e) => {
            e.stopPropagation();
            openMenu();
        };
        document.body.appendChild(btn);
        requestAnimationFrame(() => btn.classList.add('visible'));
        this._menuHint = btn;
    }

    hideMenuHint() {
        if (gameState.get('environment.isTouch')) return;
        this._menuHint?.remove();
        this._menuHint = null;
    }
}
