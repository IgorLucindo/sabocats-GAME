// MenuSystem — owns all overlay UI: menus, vote display, scoreboard, canvas transitions.

class MenuSystem {
    constructor({ canvas, divMenu }) {
        this.canvas  = canvas;
        this.divMenu = divMenu;
    }

    initialize() {}
    shutdown()   {}

    // ===== Canvas transitions =====

    fadeCanvas(ratio) {
        this.canvas.style.opacity = 1 - Math.min(ratio, 1);
    }

    unfadeCanvas(ratio) {
        this.canvas.style.opacity = Math.min(ratio, 1);
    }

    // ===== DOM helpers =====

    // Remove all overlay elements
    clear() {
        this.divMenu.innerHTML = null;
    }

    // ===== Map voting =====

    // Show the map-selection popup (triggered by lobby map board)
    openMapMenu() {
        cursorSystem.showCursor();

        const chooseMapMenu = document.createElement("div");
        chooseMapMenu.setAttribute("id", "chooseMapMenu");
        this.divMenu.appendChild(chooseMapMenu);

        const forestButton = document.createElement("button");
        forestButton.innerHTML = "forest";
        forestButton.addEventListener("click", () => {
            user.chooseMap.current = "forest";
            mapSystem.vote(user.chooseMap);
            sendChooseMapToServer();
            user.chooseMap.previous = user.chooseMap.current;
        });
        chooseMapMenu.appendChild(forestButton);

        const hillsButton = document.createElement("button");
        hillsButton.innerHTML = "hills";
        hillsButton.addEventListener("click", () => {
            user.chooseMap.current = "hills";
            mapSystem.vote(user.chooseMap);
            sendChooseMapToServer();
            user.chooseMap.previous = user.chooseMap.current;
        });
        chooseMapMenu.appendChild(hillsButton);

        const closeMapMenu = (event) => {
            if (event.target.id !== "chooseMapMenu" || event.key === "Escape") {
                this.divMenu.removeChild(chooseMapMenu);
                window.removeEventListener("click",   closeMapMenu);
                window.removeEventListener("keydown", closeMapMenu);
                cursorSystem.hideCursor();
            }
        };
        window.addEventListener("click",   closeMapMenu);
        window.addEventListener("keydown", closeMapMenu);
    }

    // Update a single map row in the vote display
    updateVoteUI({ map, number }) {
        let voteUI = document.getElementById("voteUI");
        if (!voteUI) {
            voteUI = document.createElement("div");
            voteUI.setAttribute("id", "voteUI");
            this.divMenu.appendChild(voteUI);
        }

        const numberOfPlayers = Object.keys(users).length + 1;
        let voteUIRow = document.getElementById("voteUI-" + map);

        if (!voteUIRow) {
            voteUIRow = document.createElement("div");
            voteUIRow.setAttribute("id", "voteUI-" + map);

            const mapIcon = document.createElement("div");
            mapIcon.style.backgroundImage = "url(assets/textures/maps/" + map + "/icon.png)";
            voteUIRow.appendChild(mapIcon);

            const mapStatus = document.createElement("span");
            mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
            voteUIRow.appendChild(mapStatus);

            voteUI.appendChild(voteUIRow);
        } else {
            if (number === 0) { voteUI.removeChild(voteUIRow); }
            const mapStatus = document.getElementsByTagName("span")[0];
            mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
        }
    }

    // ===== Scoreboard =====

    showScoreBoard() {
        const scoreBoard = document.createElement("div");
        scoreBoard.setAttribute("id", "scoreBoard");
        this.divMenu.appendChild(scoreBoard);

        const playerIcon = document.createElement("img");
        playerIcon.setAttribute("src", "assets/textures/characters/blackCat/icon.png");
        scoreBoard.appendChild(playerIcon);

        const playerScore = document.createElement("span");
        playerScore.innerHTML = user.points.victories + " points";
        scoreBoard.appendChild(playerScore);

        for (let i in users) {
            const remotePlayerIcon = document.createElement("img");
            remotePlayerIcon.setAttribute("src", "assets/textures/characters/blackCat/icon.png");
            scoreBoard.appendChild(remotePlayerIcon);

            const remotePlayerScore = document.createElement("span");
            remotePlayerScore.innerHTML = users[i].points.victories + " points";
            scoreBoard.appendChild(remotePlayerScore);
        }

        if (gameState.get('game.noPlayerDied')) {
            const tooEasy = document.createElement("span");
            tooEasy.innerHTML = "too easy!";
            scoreBoard.appendChild(tooEasy);
        }
    }
}
