// open map menu
function openMapMenu(){
    showCursor();
    // create map menu
    const menuContainer = document.getElementById("menuContainer");
    const chooseMapMenu = document.createElement("div");
    chooseMapMenu.setAttribute("id", "chooseMapMenu");
    menuContainer.appendChild(chooseMapMenu);
    // create forest button
    const forestButton = document.createElement("button");
    forestButton.innerHTML = "forest";
    forestButton.addEventListener("click", () => {
        user.chooseMap = {chose: true, map: "forest"};
        sendChooseMapToServer();
    });
    chooseMapMenu.appendChild(forestButton);
    // create hills button
    const hillsButton = document.createElement("button");
    hillsButton.innerHTML = "hills";
    hillsButton.addEventListener("click", () => {
        user.chooseMap = {chose: true, map: "hills"};
        sendChooseMapToServer();
    });
    chooseMapMenu.appendChild(hillsButton);
    // close map menu
    const closeMapMenu = (event) => {
        if(event.target.id != "chooseMapMenu" || event.key == "Escape"){
            menuContainer.removeChild(chooseMapMenu);
            window.removeEventListener("click", closeMapMenu);
            window.removeEventListener("keydown", closeMapMenu);
            hideCursor();
        }
    };
    window.addEventListener("click", closeMapMenu);
    window.addEventListener("keydown", closeMapMenu);
};



// choose map and wait other players to choose map
function chooseMapUpdate({map, number, previousNumber}){
    if(previousNumber == number){return;}
    const menuContainer = document.getElementById("menuContainer");
    // set choose map ui
    let chooseMapUI = document.getElementById("chooseMapUI");
    if(!chooseMapUI){
        chooseMapUI = document.createElement("div");
        chooseMapUI.setAttribute("id", "chooseMapUI");
        menuContainer.appendChild(chooseMapUI);
    }
    // set choose map ui rows
    let chooseMapUIRow = document.getElementById("chooseMapUI-" + map);
    const numberOfPlayers = Object.keys(users).length;
    if(!chooseMapUIRow){
        chooseMapUIRow = document.createElement("div");
        chooseMapUIRow.setAttribute("id", "chooseMapUI-" + map);
        const mapIcon = document.createElement("div");
        // mapIcon.style.backgroundImage = "url(../assets/images/maps/" + map + "/icon.png)";
        mapIcon.style.backgroundImage = "url(../assets/images/maps/" + "forest" + "/icon.png)";
        chooseMapUIRow.appendChild(mapIcon);
        const mapStatus = document.createElement("span");
        mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
        chooseMapUIRow.appendChild(mapStatus);
        chooseMapUI.appendChild(chooseMapUIRow);
    }
    else{
        const mapStatus = document.getElementsByTagName("span")[0];
        mapStatus.innerHTML = number + "/" + numberOfPlayers + " " + map;
    }
};



// show score board
function showScoreBoard(){
    // create score board
    const menuContainer = document.getElementById("menuContainer");
    const scoreBoard = document.createElement("div");
    scoreBoard.setAttribute("id", "scoreBoard");
    menuContainer.appendChild(scoreBoard);

    for(let i in users){
        const playerIcon = document.createElement("img");
        playerIcon.setAttribute("src", "../assets/images/players/blackCat/icon.png");
        scoreBoard.appendChild(playerIcon);
        const playerScore = document.createElement("span");
        playerScore.innerHTML = users[i].points.victories + " points";
        scoreBoard.appendChild(playerScore);
    };
    if(noPlayerDied){
        const tooEasy = document.createElement("span");
        tooEasy.innerHTML = "too easy!";
        scoreBoard.appendChild(tooEasy);
    }
};



// clear menu container
function clearMenuContainer(){
    const menuContainer = document.getElementById("menuContainer");
    menuContainer.innerHTML = null;
};