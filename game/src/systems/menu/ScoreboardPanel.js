import { gameServices } from '../../core/GameServices.js';
import { data } from '../../core/DataLoader.js';

function getDisplayName(user, charId) {
    if (user.name) return user.name;
    const charName = charId ? data.characters[charId].name : null;
    if (charName) return `${charName} ${user.loginOrder}`;
    return `Player ${user.loginOrder}`;
}

export class ScoreboardPanel {
    constructor({ divMenu }) {
        this.divMenu = divMenu;
    }

    show() {
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

        const entries = [];
        const localCharId = user.localPlayer.id;
        entries.push({
            userId: user.id,
            icon: localCharId
                ? `assets/textures/characters/${localCharId}/icon.png`
                : 'assets/textures/characters/blueCat/icon.png',
            label: getDisplayName(user, localCharId),
            victories: user.points.victories
        });
        for (let id in users) {
            if (id === user.id) continue;
            const charId = users[id].localPlayer.id;
            entries.push({
                userId: id,
                icon: charId
                    ? `assets/textures/characters/${charId}/icon.png`
                    : 'assets/textures/characters/blueCat/icon.png',
                label: getDisplayName(users[id], charId),
                victories: users[id].points.victories
            });
        }

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
                        gameServices.soundSystem.play("point");
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

    startExit() {
        const all = this.divMenu.querySelectorAll('#scoreBoard');
        if (!all.length) return;

        const ghost = all[0].cloneNode(true);
        all.forEach(el => el.remove());
        this.divMenu.appendChild(ghost);

        ghost.style.animation = 'scoreboard-exit 0.55s cubic-bezier(0.4, 0, 1, 1) forwards';
        ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
    }
}
