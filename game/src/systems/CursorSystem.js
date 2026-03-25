import { ctx, debugMode } from '../core/renderContext.js';
import { gameServices } from '../core/GameServices.js';

export class CursorSystem {
    constructor({ gameConfig, eventBus }) {
        this.gameConfig = gameConfig;
        this.eventBus = eventBus;
        this.canvasPosition = { x: 0, y: 0 };
        this.gridPosition = { x: 0, y: 0 };
        this.previousGridPosition = { x: 0, y: 0 };
        this.leftClick = { pressed: false, previousPressed: false };
        this.rightClick = { pressed: false };

        this._screenX = 0;
        this._screenY = 0;

        this.camerabox = {
            position: { x: 0, y: 0 },
            width: gameConfig.mouse.cameraboxWidth,
            height: gameConfig.mouse.cameraboxHeight
        };
    }

    initialize() {
        this.eventBus.on('input:mouseMove', ({ x, y }) => {
            this._screenX = x;
            this._screenY = y;
        });

        this.eventBus.on('input:mouseDown', ({ button, originalEvent }) => {
            this._screenX = originalEvent.x;
            this._screenY = originalEvent.y;
            if (button === 1) this.leftClick.pressed = true;
            else if (button === 2) this.rightClick.pressed = true;
        });

        this.eventBus.on('input:mouseUp', ({ button, originalEvent }) => {
            this._screenX = originalEvent.x;
            this._screenY = originalEvent.y;
            if (button === 1) this.leftClick.pressed = false;
            else if (button === 2) this.rightClick.pressed = false;
        });
    }

    update() {
        const cameraSystem = gameServices.cameraSystem;
        this.canvasPosition.x = this._screenX / cameraSystem.zoom - cameraSystem.position.x;
        this.canvasPosition.y = this._screenY / cameraSystem.zoom - cameraSystem.position.y;

        const grid = gameServices.grid;
        if (grid) {
            this.gridPosition.x = Math.floor(
                (this.canvasPosition.x - grid.position.x) / this.gameConfig.rendering.tileSize
            );
            this.gridPosition.y = Math.floor(
                (this.canvasPosition.y - grid.position.y) / this.gameConfig.rendering.tileSize
            );
        }

        this.updateCamerabox();
        cameraSystem.panCamera({ object: this.camerabox });
    }

    shutdown() {}

    updatePreviousState() {
        this.previousGridPosition.x = this.gridPosition.x;
        this.previousGridPosition.y = this.gridPosition.y;
        this.leftClick.previousPressed = this.leftClick.pressed;
    }

    render() {
        if (debugMode) {
            ctx.fillStyle = "rgba(0, 255, 0, .1)";
            ctx.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }
    }

    updateCamerabox() {
        this.camerabox.position = {
            x: this.canvasPosition.x - this.camerabox.width / 2,
            y: this.canvasPosition.y - this.camerabox.height / 2
        };
    }

    showCursor(type = "default") {
        document.body.style.cursor = "url('assets/textures/cursors/red/" + type + ".png'), auto";
    }

    hideCursor() {
        if (!debugMode) {
            document.body.style.cursor = "none";
        }
    }

    resetProperties() {
        this.camerabox.width = this.gameConfig.mouse.cameraboxWidth;
        this.camerabox.height = this.gameConfig.mouse.cameraboxHeight;
    }

    updateRemoteUser(userTemp) {
        if (!userTemp.cursor?.loaded) { return; }

        const cursor = userTemp.cursor;
        const grid = gameServices.grid;
        const objectCrate = gameServices.objectCrate;
        if (gameServices.matchStateMachine.getState() === "placing") {
            cursor.gridPosition.x = Math.floor((cursor.position.x - grid.position.x) / this.gameConfig.rendering.tileSize);
            cursor.gridPosition.y = Math.floor((cursor.position.y - grid.position.y) / this.gameConfig.rendering.tileSize);
            objectCrate.objects[userTemp.placeableObject.crateIndex].followObject({ object: cursor });
            cursor.previousGridPosition.x = cursor.gridPosition.x;
            cursor.previousGridPosition.y = cursor.gridPosition.y;
        }
    }

    renderRemoteUser(userTemp) {
        if (userTemp.cursor?.loaded) { userTemp.cursor.render(); }
    }
}
