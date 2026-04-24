// GameLoop - Owns the RAF loop, fixed-timestep logic, and render pass

import { gameServices } from './GameServices.js';
import { updateDeltaTime } from './timing.js';
import { GameConfig } from './DataLoader.js';
import { ctx, smoothZoom, renderContext } from './RenderContext.js';

export class GameLoop {
    constructor() {
        this._currentTime = 0;
        this._previousTime = 0;
        this._accumulatorTime = 0;
        this._networkAccumulator = 0;
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

        gameServices.profiler.record(dt * 1000, logicMs);

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

    // Returns true if the entity overlaps the viewport.
    // If the entity has a rotation, uses a conservative circumradius around the rotation center.
    _inView(entity, vp) {
        if (entity.rotation) {
            const rc = entity.rotationCenter;
            const dx = Math.max(Math.abs(entity.position.x - rc.x), Math.abs(entity.position.x + entity.width - rc.x));
            const dy = Math.max(Math.abs(entity.position.y - rc.y), Math.abs(entity.position.y + entity.height - rc.y));
            const r = Math.sqrt(dx * dx + dy * dy);
            return rc.x + r > vp.left && rc.x - r < vp.right && rc.y + r > vp.top && rc.y - r < vp.bottom;
        }
        return entity.position.x + entity.width > vp.left && entity.position.x < vp.right &&
               entity.position.y + entity.height > vp.top && entity.position.y < vp.bottom;
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

        const vp = cameraSystem.viewport;

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

        collisionSystem.render();

        for (let i in interactionSystem.areas) {
            const a = interactionSystem.areas[i];
            if (this._inView(a.hitbox, vp)) a.render();
        }

        for (let i in matchObjects) {
            const obj = matchObjects[i];
            if (this._inView(obj, vp)) obj.render();
        }

        for (let i in users) {
            if (users[i].id !== user.id) {
                const rp = users[i].remotePlayer;
                if (!rp) continue;
                if (this._inView(rp, vp)) rp.render();
            }
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
