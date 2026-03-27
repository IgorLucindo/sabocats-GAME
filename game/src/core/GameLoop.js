// GameLoop - Owns the RAF loop, fixed-timestep logic, and render pass

import { gameServices } from './GameServices.js';
import { updateDeltaTime } from './timing.js';
import { GameConfig } from './DataLoader.js';
import { ctx, canvas, debugMode } from './renderContext.js';
import { Profiler } from './Profiler.js';
import { DebugMenu } from './DebugMenu.js';

export class GameLoop {
    constructor() {
        this._currentTime = 0;
        this._previousTime = 0;
        this._accumulatorTime = 0;
        this._networkAccumulator = 0;
        this._profiler = new Profiler();
        if (debugMode) {
            this._debugMenu = new DebugMenu(this._profiler);
        }
        this._tick = this._tick.bind(this);
    }

    start() {
        this._previousTime = performance.now();
        this._setupVisibilityHandler();
        if (debugMode) { this._debugMenu.initialize(); }
        requestAnimationFrame(this._tick);
    }

    _tick() {
        this._currentTime = performance.now();
        const dt = (this._currentTime - this._previousTime) / 1000;
        this._previousTime = this._currentTime;
        this._accumulatorTime += dt;

        let logicMs = 0;
        while (this._accumulatorTime >= GameConfig.rendering.tickTime) {
            updateDeltaTime(GameConfig.rendering.tickTime);
            const t = performance.now();
            this._logicLoop();
            logicMs += performance.now() - t;
            this._accumulatorTime -= GameConfig.rendering.tickTime;
        }

        this._networkAccumulator += dt;
        if (this._networkAccumulator >= GameConfig.network.playerUpdateInterval / 1000) {
            this._networkFlush();
            this._networkAccumulator = 0;
        }

        this._renderLoop();

        this._profiler.record(dt * 1000, logicMs);

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
                users[i].remotePlayer?.update();
                cursorSystem.updateRemoteUser(users[i]);
            }
        }

        // Update background parallax
        background.update();

        // Update character options (lobby only)
        if (!gameServices.inMatch) {
            const characterOptions = gameServices.characterOptions;
            for (let i in characterOptions) {
                if (!characterOptions[i].selected) { characterOptions[i].update(); }
            }
        }

        // Update player
        player.update();

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
        player.updatePreviousState();
    }

    _networkFlush() {
        if (gameServices.user.connected) {
            gameServices.socketHandler.sendTick();
        }
    }

    _renderLoop() {
        const cameraSystem = gameServices.cameraSystem;
        const background = gameServices.background;
        const collisionSystem = gameServices.collisionSystem;
        const interactionSystem = gameServices.interactionSystem;
        const matchObjects = gameServices.matchObjects;
        const users = gameServices.users;
        const user = gameServices.user;
        const player = gameServices.player;
        const particleSystem = gameServices.particleSystem;
        const matchStateMachine = gameServices.matchStateMachine;
        const cursorSystem = gameServices.cursorSystem;
        const spawnArea = gameServices.spawnArea;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(cameraSystem.zoom, cameraSystem.zoom);

        background.renderSky();

        ctx.translate(cameraSystem.position.x, cameraSystem.position.y);

        background.renderBehind();

        for (let i in collisionSystem.blocks) {
            collisionSystem.blocks[i].render();
        }

        for (let i in interactionSystem.areas) {
            interactionSystem.areas[i].render();
        }

        if (debugMode && spawnArea) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(spawnArea.position.x, spawnArea.position.y, spawnArea.width, spawnArea.height);
            ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(spawnArea.position.x, spawnArea.position.y, spawnArea.width, spawnArea.height);
        }

        for (let i in matchObjects) {
            matchObjects[i].render();
        }

        for (let i in users) {
            if (users[i].id !== user.id) { users[i].remotePlayer?.render(); }
        }

        // Render character options (lobby only)
        if (!gameServices.inMatch) {
            const characterOptions = gameServices.characterOptions;
            for (let i in characterOptions) {
                if (!characterOptions[i].selected) { characterOptions[i].render(); }
            }
        }

        player.render();

        particleSystem.render();

        background.renderFront();

        matchStateMachine.render();

        for (let i in users) {
            if (users[i].id !== user.id) { cursorSystem.renderRemoteUser(users[i]); }
        }

        ctx.restore();
    }
}
