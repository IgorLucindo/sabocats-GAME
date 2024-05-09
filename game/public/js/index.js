var debugMode = true;
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
const PEAK_VELOCITY_THRESHOLD = 4;
const GRAVITY_FALL_MULTIPLIER = 1.1;
const GRAVITY_PEAK_MULTIPLIER = .5;
const PEAK_SPEED_MULTIPLIER = 1.08;
const MAX_FALL_SPEED = JUMP_VELOCITY;
// temp variables
var currentTime = 0;
var previousTime = 0;
var deltaTime = 0;
var time1 = 0;
var time2 = 0;
var frame1 = 0;
var mapVotes = 0;
// game states
var inLobby = true;
var noPlayerDied = true;

// start canvas and background
const canvas = document.querySelector(".canvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const ctx = canvas.getContext("2d");
// menu container
const divMenu = document.getElementById("divMenu");

var [
    background, staticBackground, grid,
    allCollisionBlocks, allInteractableAreas,
    playerScale, scale, tileSize
] = createLobby();
var startArea = undefined;
var finishArea = undefined;
var allParticles = [];

const scaledCanvas = {width: canvas.width/scale, height: canvas.height/scale};
const camera = new Camera();
var box = undefined;
var boxObjects = [];

var users = {};
var user = {
    id: undefined,
    connected: false,
    loginOrder: undefined,
    chooseMap: {current: undefined, previous: undefined},
    boxObject: {position: {x: 0, y: 0}, boxId: undefined, chose: false, placed: false},
    points: {victories: 0}
};

const match = new Match();

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
        frameRate: 18,
        frameBuffer: 9,
        scale: playerScale,
        idNumber: 1
    }),
    new SelectablePlayer({
        id: "blackCat",
        position: {x: 570, y: 182},
        imageSrc: "assets/images/players/blackCat/idleSitLeft.png",
        frameRate: 18,
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
gameloop();
renderloop();

// correct deltaTime depending on inactive time
correctDeltaTimeOnInactiveTime();

// send player and cursor position to server
setInterval(() => {
    if(user.connected){sendPlayerAndCursorPositionToServer();}
}, 15);

// set keyboard Events
getKeyboardEvents();
// set mouse Events
getMouseEvents();