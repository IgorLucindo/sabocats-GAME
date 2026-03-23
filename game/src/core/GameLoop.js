// GameLoop - Owns the RAF loop, fixed-timestep logic, and render pass

class GameLoop {
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
        deltaTime = (this._currentTime - this._previousTime) / 1000;
        this._previousTime = this._currentTime;
        this._accumulatorTime += deltaTime;

        gameState.set('time.current', this._currentTime);
        gameState.set('time.previous', this._previousTime);
        gameState.set('time.accumulated', this._accumulatorTime);
        gameState.set('time.deltaTime', deltaTime);

        while (this._accumulatorTime >= properties.tickTime) {
            this._logicLoop();
            this._accumulatorTime -= properties.tickTime;
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
        // Update cursor system (position calc, previous state, camera pan)
        cursorSystem.update();

        // Update remote players and cursors
        for (let i in users) {
            if (users[i].id !== user.id) {
                users[i].remotePlayer.update();
                cursorSystem.updateRemoteUser(users[i]);
            }
        }

        // Update character options
        let characterOptions = gameState.get('objects.characterOptions');
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
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(cameraSystem.zoom, cameraSystem.zoom);

        if (staticBackground) { staticBackground.render(); }

        ctx.translate(cameraSystem.position.x, cameraSystem.position.y);

        // Render behind background layers
        background.renderBehind();

        // Render all collision blocks
        for (let i in collisionSystem.blocks) {
            collisionSystem.blocks[i].render();
        }

        // Render all interactable areas
        for (let i in interactionSystem.areas) {
            interactionSystem.areas[i].render();
        }

        // Debug render start area
        if (debugMode && startArea) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(startArea.position.x, startArea.position.y, startArea.width, startArea.height);
            ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(startArea.position.x, startArea.position.y, startArea.width, startArea.height);
        }

        // Render objects
        for (let i in matchObjects) {
            matchObjects[i].render();
        }

        // Render remote players
        for (let i in users) {
            if (users[i].id !== user.id) { users[i].remotePlayer.render(); }
        }

        // Render character options
        let characterOptions = gameState.get('objects.characterOptions');
        for (let i in characterOptions) {
            if (!characterOptions[i].selected) { characterOptions[i].render(); }
        }

        // Render player
        if (player.loaded) { player.render(); }

        // Render particles
        particleSystem.render();

        // Render front background layers
        background.renderFront();

        // Render state-specific elements (delegated to state handler)
        matchStateMachine.render();

        // Render remote user cursors
        for (let i in users) {
            if (users[i].id !== user.id) { cursorSystem.renderRemoteUser(users[i]); }
        }

        ctx.restore();
    }
}

const gameLoop = new GameLoop();
