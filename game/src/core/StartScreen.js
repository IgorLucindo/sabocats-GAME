// StartScreen - Initial screen shown before game starts

export class StartScreen {
    show() {
        return new Promise((resolve) => {
            const overlay = this._createElement();
            document.body.appendChild(overlay);

            const onInput = () => {
                window.removeEventListener('keydown', onInput);
                window.removeEventListener('click', onInput);
                overlay.classList.add('start-fade-out');
                overlay.addEventListener('transitionend', () => {
                    overlay.remove();
                    resolve();
                }, { once: true });
            };

            window.addEventListener('keydown', onInput);
            window.addEventListener('click', onInput);
        });
    }

    _createElement() {
        const overlay = document.createElement('div');
        overlay.id = 'startScreen';

        const title = document.createElement('div');
        title.className = 'start-title';
        title.textContent = 'Criminal CATastrophe';
        overlay.appendChild(title);

        const prompt = document.createElement('div');
        prompt.className = 'start-prompt';
        prompt.textContent = 'PRESS ANY KEY TO START';
        overlay.appendChild(prompt);

        return overlay;
    }
}
