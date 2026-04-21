// GameLoop - Owns the RAF loop, fixed-timestep logic, and render pass

import { gameServices } from './GameServices.js';
import { updateDeltaTime } from './timing.js';
import { GameConfig } from './DataLoader.js';
import { ctx, canvas, debugMode, smoothZoom, renderContext } from './RenderContext.js';
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

        // Update match objects and state machine
        matchStateMachine.update();
        if (matchStateMachine.getState() !== 'lobby') {
            for (let i in matchObjects) { matchObjects[i].update(); }
            gameServices.spectatorSystem.update();
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

        renderContext.beginFrame(cameraSystem.zoom);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        if (!smoothZoom) ctx.scale(cameraSystem.zoom, cameraSystem.zoom);

        ctx.beginPath();
        ctx.rect(cameraSystem.position.x, cameraSystem.position.y, background.width, background.height);
        ctx.clip();

        // Sky in screen space — clipped to background bounds.
        // In normal mode: cancel outer zoom first so sky fills screen pixels.
        // In smooth-zoom mode: off-screen canvas is already at logical resolution, no unwrap needed.
        if (!smoothZoom) {
            ctx.save();
            ctx.scale(1 / cameraSystem.zoom, 1 / cameraSystem.zoom);
            background.renderSky();
            ctx.restore();
        } else {
            background.renderSky();
        }

        ctx.translate(cameraSystem.position.x + cameraSystem.shakeOffset.x, cameraSystem.position.y + cameraSystem.shakeOffset.y);

        background.renderBehind();

        for (let i in collisionSystem.blocks) {
            collisionSystem.blocks[i].render();
        }
        for (let i in collisionSystem.damageBlocks) {
            collisionSystem.damageBlocks[i].render();
        }

        for (let i in interactionSystem.areas) {
            interactionSystem.areas[i].render();
        }

        for (let i in matchObjects) {
            matchObjects[i].render();
        }

        for (let i in users) {
            if (users[i].id !== user.id) { users[i].remotePlayer?.render(); }
        }

        player.render();

        particleSystem.render();

        background.renderFront();

        matchStateMachine.render();

        ctx.restore();

        // Blit off-screen canvas to main canvas with bilinear filtering (smooth-zoom mode only).
        // Screen-space overlays (renderOverlay, cursors) draw to the main canvas after this point.
        renderContext.endFrame();

        matchStateMachine.renderOverlay();

        for (let i in users) {
            if (users[i].id !== user.id) { cursorSystem.renderRemoteUserOverlay(users[i], cameraSystem); }
        }
    }
}
