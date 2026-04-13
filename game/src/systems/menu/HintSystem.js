export class HintSystem {
    constructor({ divMenu }) {
        this.divMenu = divMenu;
    }

    show(message) {
        if (document.getElementById('hint')) return;
        const div = document.createElement('div');
        div.id = 'hint';
        const html = message.replace(/\[(\w+)\]/g, (_, key) =>
            `<img src="assets/textures/keys/${key}.png" class="hint-key">`
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
        document.getElementById('hint')?.remove();
    }

    updateBar(ratio) {
        const fill = document.querySelector('#hint .hint-bar-fill');
        if (fill) { fill.style.width = Math.min(ratio * 100, 100) + '%'; }
    }
}
