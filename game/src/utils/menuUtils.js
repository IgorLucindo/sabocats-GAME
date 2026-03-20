// open map menu
function openMapMenu(){
    mouse.showCursor();
    // create map menu
    const chooseMapMenu = document.createElement("div");
    chooseMapMenu.setAttribute("id", "chooseMapMenu");
    divMenu.appendChild(chooseMapMenu);
    // create forest button
    const forestButton = document.createElement("button");
    forestButton.innerHTML = "forest";
    forestButton.addEventListener("click", () => {
        user.chooseMap.current = "forest";
        voteMap(user.chooseMap);
        sendChooseMapToServer();
        user.chooseMap.previous = user.chooseMap.current;
    });
    chooseMapMenu.appendChild(forestButton);
    // create hills button
    const hillsButton = document.createElement("button");
    hillsButton.innerHTML = "hills";
    hillsButton.addEventListener("click", () => {
        user.chooseMap.current = "hills";
        voteMap(user.chooseMap);
        sendChooseMapToServer();
        user.chooseMap.previous = user.chooseMap.current;
    });
    chooseMapMenu.appendChild(hillsButton);
    // close map menu
    const closeMapMenu = (event) => {
        if(event.target.id != "chooseMapMenu" || event.key == "Escape"){
            divMenu.removeChild(chooseMapMenu);
            window.removeEventListener("click", closeMapMenu);
            window.removeEventListener("keydown", closeMapMenu);
            mouse.hideCursor();
        }
    };
    window.addEventListener("click", closeMapMenu);
    window.addEventListener("keydown", closeMapMenu);
};



// vote ui
function voteUI({map, number}){
    // create vote ui
    let voteUI = document.getElementById("voteUI");
    if(!voteUI){
        voteUI = document.createElement("div");
        voteUI.setAttribute("id", "voteUI");
        divMenu.appendChild(voteUI);
    }
    // create vote ui rows
    let voteUIRow = document.getElementById("voteUI-" + map);
    const numberOfPlayers = Object.keys(users).length;
    if(!voteUIRow){
        voteUIRow = document.createElement("div");
        voteUIRow.setAttribute("id", "voteUI-" + map);
        const mapIcon = document.createElement("div");
        mapIcon.style.backgroundImage = "url(assets/textures/maps/" + map + "/icon.png)";
        voteUIRow.appendChild(mapIcon);
        const mapStatus = document.createElement("span");
        mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
        voteUIRow.appendChild(mapStatus);
        voteUI.appendChild(voteUIRow);
    }
    else{
        if(number == 0){voteUI.removeChild(voteUIRow);}
        const mapStatus = document.getElementsByTagName("span")[0];
        mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
    }
};



// show score board
function showScoreBoard(){
    // create score board
    const scoreBoard = document.createElement("div");
    scoreBoard.setAttribute("id", "scoreBoard");
    divMenu.appendChild(scoreBoard);

    for(let i in users){
        const playerIcon = document.createElement("img");
        playerIcon.setAttribute("src", "assets/textures/characters/blackCat/icon.png");
        scoreBoard.appendChild(playerIcon);
        const playerScore = document.createElement("span");
        playerScore.innerHTML = users[i].points.victories + " points";
        scoreBoard.appendChild(playerScore);
    };
    if(gameState.get('game.noPlayerDied')){
        const tooEasy = document.createElement("span");
        tooEasy.innerHTML = "too easy!";
        scoreBoard.appendChild(tooEasy);
    }
};



// fade canvas
function fadeCanvas(ratio){
    if(ratio > 1){ratio = 1;}
    canvas.style.opacity = 1 - ratio;
};



// unfade canvas
function unfadeCanvas(ratio){
    if(ratio > 1){ratio = 1;}
    canvas.style.opacity = ratio;
};



// clear div menu
function clearDivMenu(){
    divMenu.innerHTML = null;
};