// open map menu
function openMapMenu(){
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