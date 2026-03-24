// GameLoop - Owns the RAF loop, fixed-timestep logic, and render pass

import { gameServices } from './GameServices.js';
import { updateDeltaTime } from './timing.js';
import { GameConfig } from './DataLoader.js';
import { ctx, canvas, debugMode } from './renderContext.js';

export class GameLoop {
    constructor() {
        this._currentTime = 0;
        this._previousTime = 0;
        this._accumulatorTime = 0;
        this._tick = this._tick.bind(this);
    }

    start() {
        this._previousTime = performance.now();
        this._setupVisibilityHandler();
        requestAnimationFrame(this._tick);
    }

    _tick() {
        this._currentTime = performance.now();
        const dt = (this._currentTime - this._previousTime) / 1000;
        updateDeltaTime(dt);
        this._previousTime = this._currentTime;
        this._accumulatorTime += dt;

        while (this._accumulatorTime >= GameConfig.rendering.tickTime) {
            this._logicLoop();
            this._accumulatorTime -= GameConfig.rendering.tickTime;
        }

        this._renderLoop();
        requestAnimationFrame(this._tick);
    }

    _setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this._previousTime = performance.now();
            }
        });
    }

    _logicLoop() {
        const cursorSystem = gameServices.cursorSystem;
        const users = gameServices.users;
        const user = gameServices.user;
        const player = gameServices.player;
        const interactionSystem = gameServices.interactionSystem;
        const particleSystem = gameServices.particleSystem;
        const mapSystem = gameServices.mapSystem;
        const cameraSystem = gameServices.cameraSystem;
        const matchObjects = gameServices.matchObjects;
        const matchStateMachine = gameServices.matchStateMachine;
        const inputSystem = gameServices.inputSystem;
        const background = gameServices.background;

        // Update cursor system (position calc, previous state, camera pan)
        cursorSystem.update();

        // Update remote players and cursors
        for (let i in users) {
            if (users[i].id !== user.id) {
                users[i].remotePlayer.update();
                cursorSystem.updateRemoteUser(users[i]);
            }
        }

        // Update background parallax
        background.update();

        // Update character options
        const characterOptions = gameServices.characterOptions;
        for (let i in characterOptions) {
            if (!characterOptions[i].selected) { characterOptions[i].update(); }
        }

        // Update player
        if (player.loaded) { player.update(); }

        // Update interactable areas
        interactionSystem.update();

        // Update particles
        particleSystem.update();

        // Update vote UI and check map change
        mapSystem.update();

        // Update camera
        cameraSystem.update();

        // Update match objects and state
        if (gameServices.inMatch) {
            for (let i in matchObjects) { matchObjects[i].update(); }
            matchStateMachine.update();
        }

        // Save previous state for next frame's delta detection
        cursorSystem.updatePreviousState();
        inputSystem.updatePreviousState();
        if (player.loaded) {
            player.previousGrounded = player.grounded;
            player.previousVelocity.y = player.velocity.y;
        }
    }

    _renderLoop() {
        const cameraSystem = gameServices.cameraSystem;
        const background = gameServices.background;
        const staticBackground = gameServices.staticBackground;
        const collisionSystem = gameServices.collisionSystem;
        const interactionSystem = gameServices.interactionSystem;
        const matchObjects = gameServices.matchObjects;
        const users = gameServices.users;
        const user = gameServices.user;
        const player = gameServices.player;
        const particleSystem = gameServices.particleSystem;
        const matchStateMachine = gameServices.matchStateMachine;
        const cursorSystem = gameServices.cursorSystem;
        const startArea = gameServices.startArea;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(cameraSystem.zoom, cameraSystem.zoom);

        if (staticBackground) { staticBackground.render(); }

        ctx.translate(cameraSystem.position.x, cameraSystem.position.y);

        background.renderBehind();

        for (let i in collisionSystem.blocks) {
            collisionSystem.blocks[i].render();
        }

        for (let i in interactionSystem.areas) {
            interactionSystem.areas[i].render();
        }

        if (debugMode && startArea) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(startArea.position.x, startArea.position.y, startArea.width, startArea.height);
            ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(startArea.position.x, startArea.position.y, startArea.width, startArea.height);
        }

        for (let i in matchObjects) {
            matchObjects[i].render();
        }

        for (let i in users) {
            if (users[i].id !== user.id) { users[i].remotePlayer.render(); }
        }

        const characterOptions = gameServices.characterOptions;
        for (let i in characterOptions) {
            if (!characterOptions[i].selected) { characterOptions[i].render(); }
        }

        if (player.loaded) { player.render(); }

        particleSystem.render();

        background.renderFront();

        matchStateMachine.render();

        for (let i in users) {
            if (users[i].id !== user.id) { cursorSystem.renderRemoteUser(users[i]); }
        }

        ctx.restore();
    }
}
