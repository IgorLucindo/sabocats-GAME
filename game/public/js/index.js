// game properties
const GRAVITY = 1;
const WALK_ACCELERATION = .1;
const WALK_MAX_VELOCITY = 5;
const RUN_ACCELERATION = .3;
const RUN_MAX_VELOCITY = 8;
const DECELERATION = .5;
const JUMP_VELOCITY = 20;
const HORIZONTAL_WALLSLIDE_JUMP_VELOCITY = 10;
const HORIZONTAL_WALLSLIDE_SPRINT_JUMP_VELOCITY = 13;
const WALLSLIDE_VELOCITY = 3;
const STOP_WALLSLIDING_TOTAL_FRAMES = 20;
const TILE_SIZE = 42;

var gravityTemp = GRAVITY;
var currentTime = 0;
var previousTime = 0;
var deltaTime = 0;
var idleFrameCicles = 0;
var scoreBoardTime = 0;
var closeMapTime = 0;
var openMapTime = 0;
var stopWallSlidingFrame = 0;
var playersFinished = 0;
var mapVotes = 0;

var inLobby = true;
var choosingPhase = false;
var placingPhase = false;
var playingPhase = false;
var socketConnected = false;
var noPlayerDied = true;

// start canvas and background
const canvas = document.querySelector(".canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const c = canvas.getContext("2d");
// menu container
const divMenu = document.getElementById("divMenu");

var [
    background, staticBackground, grid,
    allCollisionBlocks, allInteractableAreas,
    playerScale, scale, tileSize
] = createLobby();
var startArea = undefined;
var finishArea = undefined;
var allObjects = [];

const scaledCanvas = {width: canvas.width/scale, height: canvas.height/scale};
const camera = new Camera();
var box = {loadBox: false};
var boxObjects = [];

var users = {};
var user = {
    id: undefined,
    chooseMap: {current: undefined, previous: undefined},
    boxObject: {position: {x: 0, y: 0}, boxNumber: undefined, chose: false, placed: false},
    points: {victories: 0}
};

const choseMaps = {
    forest: {map: "forest", number: 0, previousNumber: 0},
    hills: {map: "hills", number: 0, previousNumber: 0}
};



// selectable player
var selectablePlayers = [
    new SelectablePlayer({
        id: "blackCat",
        position: {x: 390, y: 125},
        imageSrc: "assets/images/players/blackCat/idleSit.png",
        frameRate: 12,
        frameBuffer: 9,
        scale: playerScale,
        idNumber: 1
    }),
    new SelectablePlayer({
        id: "blackCat",
        position: {x: 570, y: 182},
        imageSrc: "assets/images/players/blackCat/idleSitLeft.png",
        frameRate: 12,
        frameBuffer: 9,
        scale: playerScale,
        idNumber: 2
    })
];
var player = {position: {x: 0, y: 0}, currentSprite: undefined, loaded: false};

// controller state
const keys = {
    w: {pressed: false},
    a: {pressed: false},
    d: {pressed: false},
    e: {pressed: false, previousPressed: false},
    r: {pressed: false},
    space: {pressed: false, previousPressed: false},
    shift: {pressed: false}
};
const mouse = new Mouse();


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

    // load collision blocks
    for(let i in allCollisionBlocks){
        allCollisionBlocks[i].update();
    };

    // load all interactable areas
    for(let i in allInteractableAreas){
        allInteractableAreas[i].update();
    };

    // load objects
    for(let i in allObjects){
        allObjects[i].update();
    };

    // load users online players
    for(let i in users){
        userOnlinePlayerUpdate(users[i]);
    };

    // load selectable players
    for(let i in selectablePlayers){
        if(!selectablePlayers[i].selected){selectablePlayers[i].update();}
    };

    // load player
    if(player.loaded){
        player.checkForHorizontalCanvasCollision();
        player.update();
        // controller
        if(!player.dead){
            run();
            jump();
            wallSlide();
        }
        deceleration();
        verticalMovement({
            peakVelocityThreshold: 4,
            gravityFallMultiplier: 1.1,
            gravityPeakMultiplier: .5,
            peakSpeedMultiplier: 1.08,
            maxFallSpeed: JUMP_VELOCITY
        });
    }
    // finish round if all players finished
    if(player.finished){checkEndingOfRound({scoreBoardTimer: 5});}

    // update front background layers
    background.updateFront();

    // load object box
    if(choosingPhase){box.update();}

    // load mouse
    if(placingPhase){mouse.update();}

    // check box objects
    for(let i in box.objects){
        box.objects[i].updateInBox();
        if(!box.objects.length){break;}
    };

    // load users cursors
    for(let i in users){
        userCursorUpdate(users[i]);
    };
    
    // update vote ui
    if(inLobby){updateVoteUI();}

    // check map change
    checkMapChange({closeMapTimer: 1, openMapTimer: 1});
    
    // load camera
    camera.update();

    c.restore();

    // set previous state
    setPreviousState();

    requestAnimationFrame(animate);
};
animate();

// send player and cursor position to server
setInterval(() => {
    if(socketConnected){sendPlayerAndCursorPositionToServer();}
}, 15);

// set keyboard Events
setKeyboardEvents();
// set mouse Events
setMouseEvents();