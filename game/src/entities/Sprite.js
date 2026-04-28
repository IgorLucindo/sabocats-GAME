import { ctx } from '../core/RenderContext.js';
import { mouseOverObject, mouseOverObjectScreen } from '../helpers.js';
import { gameServices } from '../core/GameServices.js';
import { GameConfig } from '../core/DataLoader.js';

// Sprite - Base class for all visual entities
export class Sprite {
    constructor({position, texture, frames = 1, frameBuffer = 3, scale = GameConfig.rendering.pixelScale, highlightStyle = 'tint'}) {
        this.position = position;
        this.scale = scale;
        this.imageLoaded = false;
        this.image = new Image();
        this.image.onload = () => {
            this.width = this.image.width / this.frames * this.scale;
            this.height = this.image.height * this.scale;
            this.imageLoaded = true;
        };
        if (texture) { this.image.src = texture; }
        this.frames = frames;
        this.currentFrame = 0;
        this.frameBuffer = frameBuffer;
        this.elapsedFrames = 0;

        this.selected = false;
        this.setHighlightStyle(highlightStyle);
        this.highlighted = false;
        this.flipped = false;
    }

    // draw image
    draw() {
        if (!this.imageLoaded || !this.image.complete) { return; }

        const cropbox = {
            position: {x: this.currentFrame * this.image.width / this.frames, y: 0},
            width: this.image.width / this.frames,
            height: this.image.height
        };

        const drawX = Math.round(this.position.x);
        const drawY = Math.round(this.position.y);

        if (this.flipped) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                cropbox.position.x,
                cropbox.position.y,
                cropbox.width,
                cropbox.height,
                -(drawX + this.width),
                drawY,
                this.width,
                this.height
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.image,
                cropbox.position.x,
                cropbox.position.y,
                cropbox.width,
                cropbox.height,
                drawX,
                drawY,
                this.width,
                this.height
            );
        }
    }

    // draw rotated image
    drawRotated(rotation, center) {
        if (!this.imageLoaded || !this.image.complete) { return; }

        const cropbox = {
            position: {x: this.currentFrame * this.image.width / this.frames, y: 0},
            width: this.image.width / this.frames,
            height: this.image.height
        };
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(
            this.image,
            cropbox.position.x,
            cropbox.position.y,
            cropbox.width,
            cropbox.height,
            -center.x + this.position.x,
            -center.y + this.position.y,
            this.width,
            this.height
        );
    }

    // render sprite
    render() {
        this.draw();
    }

    // update animation frames
    updateFrames() {
        this.elapsedFrames++;
        if (this.elapsedFrames % this.frameBuffer == 0) {
            if (this.currentFrame < this.frames - 1) { this.currentFrame++; }
            else { this.currentFrame = 0; }
        }
    }

    // render highlight effect
    setHighlightStyle(style) {
        const presets = {
            tint:   { scale: 1.1,  filter: "opacity(.8) drop-shadow(0 0 0 white)",       originBottom: false },
            tintUp: { scale: 1.1,  filter: "opacity(.8) drop-shadow(0 0 0 white)",       originBottom: true  },
            glow:   { scale: 1.15, filter: `drop-shadow(0 0 ${3 * this.scale}px white)`, originBottom: false },
            glowUp: { scale: 1.15, filter: `drop-shadow(0 0 ${3 * this.scale}px white)`, originBottom: true  },
        };
        this._highlightStyle = presets[style];
    }

    renderHighlight() {
        if (!this.highlighted || !this.imageLoaded) { return; }
        const { scale, filter, originBottom } = this._highlightStyle;
        const cx = this.position.x + this.width / 2;
        const cy = originBottom
            ? this.position.y + this.height
            : this.position.y + this.height / 2;
        ctx.translate( cx,  cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        if (filter) { ctx.filter = filter; }
    }

    // trigger callback on mouse hover and click
    mouseOver({object, func}) {
        if (!this.imageLoaded) { return; }

        const cursorSystem = gameServices.cursorSystem;
        if (cursorSystem.blocked) { this.highlighted = false; return; }
        if (mouseOverObject({object, cursorSystem})) {
            this.highlighted = true;
            if (!cursorSystem.leftClick.previousPressed && cursorSystem.leftClick.pressed) {
                this.selected = true;
                func();
            }
        } else {
            this.highlighted = false;
        }
    }

    // trigger callback on mouse hover and click (screen-space coords)
    mouseOverScreen({object, func}) {
        if (!this.imageLoaded) { return; }

        const cursorSystem = gameServices.cursorSystem;
        if (cursorSystem.blocked) { this.highlighted = false; return; }
        if (mouseOverObjectScreen({object, cursorSystem})) {
            this.highlighted = true;
            if (!cursorSystem.leftClick.previousPressed && cursorSystem.leftClick.pressed) {
                this.selected = true;
                func();
            }
        } else {
            this.highlighted = false;
        }
    }
}
