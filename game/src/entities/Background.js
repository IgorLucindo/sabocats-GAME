import { ctx, scaledCanvas } from '../core/renderContext.js';
import { gameServices } from '../core/GameServices.js';
import { Sprite } from './Sprite.js';

// Layer — a single parallax-scrolling background layer (private to Background)
class Layer extends Sprite {
    constructor({ position, parallaxSpeed = 0, grid = false, texture, scale }) {
        super({ position, texture, scale });
        this.parallaxSpeed = parallaxSpeed;
        this.grid = grid;
    }

    update() {
        this.position.x = -gameServices.cameraSystem.position.x * this.parallaxSpeed;
    }

    render() {
        ctx.save();
        if (this.grid) {
            const state = gameServices.matchStateMachine.getState();
            if (state === "choosing" || state === "placing") {
                ctx.filter = "opacity(.6)";
                this.draw();
            }
        } else {
            this.draw();
        }
        ctx.restore();
    }
}

// Background — a multi-layer parallax background with optional front/behind layering
export class Background {
    constructor({ width, height, images, objects, scale }) {
        this.scale  = scale;
        this.width  = width  * this.scale;
        this.height = height * this.scale;

        this.behindLayers = [];
        this.frontLayers  = [];
        this.gridLayer    = null;

        for (const key in images) {
            const img   = images[key];
            const layer = new Layer({
                position:      { x: 0, y: 0 },
                parallaxSpeed: img.parallaxSpeed,
                grid:          img.grid,
                texture:       img.texture,
                scale:         this.scale
            });
            if (img.grid)  { this.gridLayer = layer; }
            if (img.front) { this.frontLayers.push(layer); }
            else           { this.behindLayers.push(layer); }
        }

        this.layers = this.behindLayers.concat(this.frontLayers);

        this.spriteObjects = [];
        for (const key in objects) {
            const obj = objects[key];
            this.spriteObjects.push(new Sprite({
                position: obj.position,
                texture:  obj.texture,
                scale:    obj.scale
            }));
        }
    }

    update() {
        for (const layer of this.layers) { layer.update(); }
    }

    // Layers that sit behind game entities
    renderBehind() {
        for (const layer of this.behindLayers) { layer.render(); }
        for (const sprite of this.spriteObjects) { sprite.render(); }
    }

    // Layers that sit in front of game entities
    renderFront() {
        for (const layer of this.frontLayers) { layer.render(); }
    }
}
