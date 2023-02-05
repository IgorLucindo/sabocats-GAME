// game properties
const GRAVITY = 2;
const WALK_ACCELERATION = 1;
const WALK_MAX_VELOCITY = 20;
const RUN_ACCELERATION = 2;
const RUN_MAX_VELOCITY = 30;
const DECELERATION = 4;
const JUMP_VELOCITY = 60;
const HORIZONTAL_WALLSLIDE_JUMP_VELOCITY = 35;
const WALLSLIDE_VELOCITY = 6;

var gravityTemp = GRAVITY;
var currentTime = 0;
var previousTime = 0;
var deltaTime = 0;
var inLobby = true;

// start canvas and background
const canvas = document.querySelector(".canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const c = canvas.getContext("2d");
var [
    background, staticBackground, grid,
    allCollisionBlocks, allInteractableAreas,
    playerScale, scale, TILE_SIZE
] = createLobby();
var [startArea, finishArea] = [undefined, undefined];
var allObjects = [];

const scaledCanvas = {width: canvas.width / scale, height: canvas.height / scale};
const camera = {position: {x: 0, y: 0}};
var box = {loadBox: false};

var users = {};
var user = {id: undefined, chooseMap: {chose: false}};
const choseMaps = {
    forest: {map: "forest", number: 0, previousNumber: 0},
    hills: {map: "hills", number: 0, previousNumber: 0}
};



// selectable player
var selectablePlayers = [
    new SelectablePlayer({
        id: "blackCat",
        position: {x: 390, y: 125},
        imageSrc: "../assets/images/players/blackCat/idleSit.png",
        frameRate: 12,
        frameBuffer: 8,
        scale: playerScale,
        idNumber: 1
    }),
    new SelectablePlayer({
        id: "blackCat",
        position: {x: 570, y: 182},
        imageSrc: "../assets/images/players/blackCat/idleSitLeft.png",
        frameRate: 12,
        frameBuffer: 8,
        scale: playerScale,
        idNumber: 2
    })
];
var player = {loaded: false};

// controller state
const keys = {
    a: {pressed: false},
    d: {pressed: false},
    e: {pressed: false, previousPressed: false},
    space: {pressed: false, previousPressed: false},
    shift: {pressed: false}
};
const mouse = {
    down: false,
    move: false,
    event: null,
    position: {x: 0, y: 0},
    gridPosition: {x: 0, y: 0},
    previousGridPosition: {x: 0, y: 0},
    mouse1: {pressed: false, previousPressed: false},
    mouse2: {pressed: false}
};



// run game
function animate(){
    // get the current time
    currentTime = performance.now();
    // get mouse events
    mouseEventsUpdate();
    // get the delta time
    deltaTime = (currentTime - previousTime)/1000;

    c.fillStyle = "white";
    c.fillRect(0, 0, canvas.width, canvas.height);
    
    c.save();
    c.scale(scale, scale);

    if(staticBackground){staticBackground.update();}
    c.translate(camera.position.x, camera.position.y);

    // update behind background layers
    background.updateBehind();

    // draw collision blocks
    allCollisionBlocks.forEach((allCollisionBlocks) =>{
        allCollisionBlocks.update();
    });

    // load all interactable areas
    for(let i in allInteractableAreas){
        allInteractableAreas[i].update();
    };

    // load objects
    for(let i in allObjects){
        allObjects[i].update();
    };

    // load users online players
    usersOnlinePlayersUpdate();

    // load selectable players
    for(let i in selectablePlayers){
        if(!selectablePlayers[i].selected){selectablePlayers[i].update();}
    };

    // load player
    if(player.loaded){
        player.checkForHorizontalCanvasCollision();
        player.update();
        // controller events
        run();
        jump();
        wallSlide();
        verticalMovement({
            peakVelocityThreshold: 8,
            gravityFallMultiplier: 1.1,
            gravityPeakMultiplier: .6,
            peakSpeedMultiplier: 1.1,
            maxFallSpeed: JUMP_VELOCITY
        });
        sendPositionToServer();
    }

    // update front background layers
    background.updateFront();

    // load object box
    if(box.loadBox){box.update();}

    // update chose map
    if(inLobby){choseMapUpdate();}
    

    c.restore();

    // set previous state
    previousTime = currentTime;
    mouse.previousGridPosition.x = mouse.gridPosition.x;
    mouse.previousGridPosition.y = mouse.gridPosition.y;
    keys.e.previousPressed = keys.e.pressed;
    mouse.mouse1.previousPressed = mouse.mouse1.pressed;

    requestAnimationFrame(animate);
};
animate();

// set keyboard Events
setKeyboardEvents();
// set mouse Events
setMouseEvents();