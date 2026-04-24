import { canvas } from '../core/RenderContext.js';
import { gameServices } from '../core/GameServices.js';
import { getCursorColor } from '../helpers.js';

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
        this._cursorType = null;

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
            if (button === 1) {
                this.leftClick.pressed = true;
                if (this._cursorType === 'block') this.shakeBlockCursor();
            }
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

        this.gridPosition.x = Math.floor(this.canvasPosition.x / this.gameConfig.rendering.tileSize);
        this.gridPosition.y = Math.floor(this.canvasPosition.y / this.gameConfig.rendering.tileSize);

        this.updateCamerabox();

        const state = gameServices.matchStateMachine.getState();
        if (!this.blocked && !gameServices.player.loaded && (state === "placing" || state === 'lobby') && !gameServices.user.placeableObject?.placed) {
            this.applyEdgePan();
        }
    }

    // Apply edge-zone screen panning
    applyEdgePan() {
        const { edgePanZone, edgePanMaxSpeed } = this.gameConfig.mouse;
        const sw = canvas.width;
        const sh = canvas.height;

        let dx = 0, dy = 0;
        if (this._screenX > sw - edgePanZone) {
            dx = (this._screenX - (sw - edgePanZone)) / edgePanZone * edgePanMaxSpeed;
        } else if (this._screenX < edgePanZone) {
            dx = (this._screenX - edgePanZone) / edgePanZone * edgePanMaxSpeed;
        }
        if (this._screenY > sh - edgePanZone) {
            dy = (this._screenY - (sh - edgePanZone)) / edgePanZone * edgePanMaxSpeed;
        } else if (this._screenY < edgePanZone) {
            dy = (this._screenY - edgePanZone) / edgePanZone * edgePanMaxSpeed;
        }

        if (dx !== 0 || dy !== 0) {
            gameServices.cameraSystem.pan({ dx, dy });
        }
    }

    shutdown() {}

    get blocked() { return gameServices.menuSystem.isMenuOpen; }

    updatePreviousState() {
        this.previousGridPosition.x = this.gridPosition.x;
        this.previousGridPosition.y = this.gridPosition.y;
        this.leftClick.previousPressed = this.leftClick.pressed;
    }

    updateCamerabox() {
        this.camerabox.position = {
            x: this.canvasPosition.x - this.camerabox.width / 2,
            y: this.canvasPosition.y - this.camerabox.height / 2
        };
    }

    showCursor(type = "default") {
        this._cursorType = type;
        const color = getCursorColor(gameServices.user.loginOrder);
        const url = `url('assets/textures/cursors/${color}/${type}.png'), auto`;
        document.body.style.cursor = url;
    }

    hideCursor() {
        this._cursorType = null;
        document.body.style.cursor = "none";
    }

    shakeBlockCursor() {
        if (this._shaking) return;
        gameServices.soundSystem.play('error');
        this._shaking = true;

        const color = getCursorColor(gameServices.user.loginOrder);
        const img = document.createElement('img');
        img.src = `assets/textures/cursors/${color}/block.png`;
        img.className = 'cursor-shake-img';
        img.style.left = this._screenX + 'px';
        img.style.top = this._screenY + 'px';
        document.body.appendChild(img);
        document.body.style.cursor = 'none';

        img.addEventListener('animationend', () => {
            img.remove();
            this._shaking = false;
            if (this._cursorType !== null) this.showCursor('block');
        }, { once: true });
    }

    get screenPosition() { return { x: this._screenX, y: this._screenY }; }

    resetProperties() {
        this.camerabox.width = this.gameConfig.mouse.cameraboxWidth;
        this.camerabox.height = this.gameConfig.mouse.cameraboxHeight;
    }

    updateRemoteUser(userTemp) {
        if (!userTemp.cursor) { return; }

        const cursor = userTemp.cursor;
        const objectCrate = gameServices.objectCrate;
        if (gameServices.matchStateMachine.getState() === "placing") {
            cursor.gridPosition.x = Math.floor(cursor.position.x / this.gameConfig.rendering.tileSize);
            cursor.gridPosition.y = Math.floor(cursor.position.y / this.gameConfig.rendering.tileSize);
            if (!userTemp.placeableObject?.placed) {
                objectCrate.objects[userTemp.placeableObject?.crateIndex]?.followObject({ object: cursor });
            }
            cursor.previousGridPosition.x = cursor.gridPosition.x;
            cursor.previousGridPosition.y = cursor.gridPosition.y;
        }
    }

    renderRemoteUser(userTemp) {
        if (userTemp.cursor?.loaded) { userTemp.cursor.render(); }
    }

    renderRemoteUserOverlay(userTemp, cameraSystem) {
        if (!userTemp.cursor?.loaded) { return; }
        const cursor = userTemp.cursor;
        const sx = (cursor.position.x + cameraSystem.position.x) * cameraSystem.zoom;
        const sy = (cursor.position.y + cameraSystem.position.y) * cameraSystem.zoom;
        const savedX = cursor.position.x;
        const savedY = cursor.position.y;
        cursor.position.x = sx;
        cursor.position.y = sy;
        cursor.render();
        cursor.position.x = savedX;
        cursor.position.y = savedY;
    }
}
