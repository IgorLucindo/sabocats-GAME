import { ctx } from '../core/RenderContext.js';
import { gameServices } from '../core/GameServices.js';
import { GameConfig } from '../core/DataLoader.js';
import { Sprite } from './Sprite.js';
import { lerpSnap } from '../helpers.js';

// Layer — a single parallax-scrolling background layer (private to Background)
class Layer extends Sprite {
    constructor({ position, parallaxSpeed = 0, texture, scale }) {
        super({ position, texture, scale });
        this.parallaxSpeed = parallaxSpeed;
    }

    update() {
        this.position.x = -gameServices.cameraSystem.position.x * this.parallaxSpeed;
    }

    render() {
        this.draw();
    }
}

// SkyLayer — sky parallax layer rendered before camera transform (screen space)
// update() uses camera.position.x directly (already -scrollOffset) so the drift goes left as camera moves right.
// render() tiles horizontally so the edge of the texture never becomes visible.
class SkyLayer extends Sprite {
    constructor({ parallaxSpeed = 0, texture, scale }) {
        super({ position: { x: 0, y: 0 }, texture, scale });
        this.parallaxSpeed = parallaxSpeed;
    }

    update() {
        this.position.x = gameServices.cameraSystem.position.x * this.parallaxSpeed;
    }

    render() {
        if (!this.image || !this.image.complete) return;
        const w = this.width;
        const h = this.height;
        // Normalize x to [-w, 0) so repeating tiles always cover from the left edge
        const baseX = ((this.position.x % w) + w) % w - w;
        const tilesNeeded = Math.ceil(ctx.canvas.width / w) + 2;
        for (let i = 0; i < tilesNeeded; i++) {
            ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, baseX + i * w, 0, w, h);
        }
    }
}

// Background — a multi-layer parallax background with optional sky, front/behind layering
export class Background {
    constructor({ width, height, images, objects, sky }) {
        this.scale  = GameConfig.rendering.pixelScale;
        this.width  = width  * this.scale;
        this.height = height * this.scale;

        this._skyLayers = [];
        if (sky) {
            for (const img of Object.values(sky)) {
                this._skyLayers.push(new SkyLayer({
                    parallaxSpeed: img.parallaxSpeed,
                    texture:       img.texture,
                    scale:         this.scale
                }));
            }
        }

        this.behindLayers = [];
        this.frontLayers  = [];

        for (const img of Object.values(images)) {
            const layer = new Layer({
                position:      { x: 0, y: 0 },
                parallaxSpeed: img.parallaxSpeed,
                texture:       img.texture,
                scale:         this.scale
            });
            if (img.front) { this.frontLayers.push(layer); }
            else           { this.behindLayers.push(layer); }
        }

        this.layers = this.behindLayers.concat(this.frontLayers);

        this.spriteObjects = [];
        for (const obj of Object.values(objects)) {
            this.spriteObjects.push(new Sprite({
                position: obj.position,
                texture:  obj.texture,
                scale:    obj.scale
            }));
        }

        this._gridAlpha = 0;
    }

    update() {
        for (const layer of this._skyLayers) { layer.update(); }
        for (const layer of this.layers) { layer.update(); }
        const state  = gameServices.matchStateMachine.getState();
        if (state === "playing") { this._gridAlpha = lerpSnap(this._gridAlpha, 0, 0.2, 0.005); }
        else if (state === "choosing") { this._gridAlpha = lerpSnap(this._gridAlpha, 1, 0.06, 0.005); }
    }

    // Renders sky layers — called before camera translate (screen-fixed with optional horizontal parallax)
    renderSky() {
        for (const layer of this._skyLayers) { layer.render(); }
    }

    // Layers that sit behind game entities
    renderBehind() {
        for (const layer of this.behindLayers) { layer.render(); }
        for (const sprite of this.spriteObjects) { sprite.render(); }
        this._renderGrid();
    }

    // Layers that sit in front of game entities
    renderFront() {
        for (const layer of this.frontLayers) { layer.render(); }
    }

    // Dynamically draws a two-level wobbly grid overlay during choosing/placing states.
    // Minor lines at every tile, major lines at every gridMajorInterval tiles.
    _renderGrid() {
        if (this._gridAlpha < 0.01) return;

        const grid = gameServices.grid;
        if (!grid) return;

        const tileSize = GameConfig.rendering.tileSize;
        const majorInterval = GameConfig.rendering.gridMajorInterval;
        const ox = grid.position.x;
        const oy = grid.position.y;
        const cols = Math.ceil((this.width  - ox) / tileSize);
        const rows = Math.ceil((this.height - oy) / tileSize);

        ctx.save();
        ctx.globalAlpha = this._gridAlpha;

        // Background fill — warm paper tint
        ctx.fillStyle = "rgba(210, 225, 235, 0.7)";
        ctx.fillRect(0, 0, this.width, this.height);

        // Minor grid — electric cyan wobbly dashes at every tile
        ctx.strokeStyle = "rgba(210, 225, 235, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 10]);
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
            this._wobblyLine(ox + c * tileSize, oy, ox + c * tileSize, this.height, 7);
        }
        for (let r = 0; r <= rows; r++) {
            this._wobblyLine(ox, oy + r * tileSize, ox + this.width, oy + r * tileSize, 7);
        }
        ctx.stroke();

        // Major grid — hot amber wobbly dashes at every majorInterval tiles
        ctx.strokeStyle = "rgba(255, 160, 10, 0.9)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 16]);
        ctx.beginPath();
        for (let c = 0; c <= cols; c += majorInterval) {
            this._wobblyLine(ox + c * tileSize, oy, ox + c * tileSize, this.height, 6);
        }
        for (let r = 0; r <= rows; r += majorInterval) {
            this._wobblyLine(ox, oy + r * tileSize, ox + this.width, oy + r * tileSize, 6);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Minor intersection dots — small cyan pixel squares
        ctx.fillStyle = "rgba(50, 210, 255, 0.75)";
        for (let c = 0; c <= cols; c++) {
            for (let r = 0; r <= rows; r++) {
                if (c % majorInterval === 0 && r % majorInterval === 0) { continue; }
                ctx.fillRect(ox + c * tileSize - 1, oy + r * tileSize - 1, 2, 2);
            }
        }

        // Major intersection markers — amber pixel crosses
        ctx.fillStyle = "rgba(255, 160, 10, 1.0)";
        for (let c = 0; c <= cols; c += majorInterval) {
            for (let r = 0; r <= rows; r += majorInterval) {
                const x = ox + c * tileSize;
                const y = oy + r * tileSize;
                ctx.fillRect(x - 3, y - 1, 6, 2);
                ctx.fillRect(x - 1, y - 3, 2, 6);
            }
        }

        ctx.restore();
    }



    // Draw a wobbly line using quadratic bezier segments.
    // amplitude — max pixel offset perpendicular to the line
    // numBends is derived from line length: more tiles = more waves
    _wobblyLine(x1, y1, x2, y2, amplitude) {
        const tileSize = GameConfig.rendering.tileSize;
        const isVert   = x1 === x2;
        const length   = isVert ? (y2 - y1) : (x2 - x1);
        const numBends = Math.max(1, Math.round(length / tileSize * 0.3));
        const segs     = numBends + 1;
        let prevX = x1, prevY = y1;
        ctx.moveTo(x1, y1);
        for (let i = 1; i <= segs; i++) {
            const t  = i / segs;
            const ex = isVert ? x1 : x1 + t * (x2 - x1);
            const ey = isVert ? y1 + t * (y2 - y1) : y1;
            const mx = (prevX + ex) / 2;
            const my = (prevY + ey) / 2;
            const w  = this._hash(mx, my) * amplitude;
            ctx.quadraticCurveTo(
                isVert ? mx + w : mx,
                isVert ? my     : my + w,
                ex, ey
            );
            prevX = ex; prevY = ey;
        }
    }



    // Deterministic hash — stable per-frame wobble based on world position.
    // Returns value in [-1, 1].
    _hash(a, b) {
        const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }
}
