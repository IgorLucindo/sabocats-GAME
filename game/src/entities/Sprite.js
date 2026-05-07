import { ctx } from '../core/RenderContext.js';
import { mouseOverObjectScreen } from '../helpers.js';
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
        const s = this.scale || 1;
        const presets = {
            tint:   { scale: 1.1,  alpha: 0.8,  shadow: { blur: 0.001, color: 'white' }, originBottom: false },
            tintUp: { scale: 1.1,  alpha: 0.8,  shadow: { blur: 0.001, color: 'white' }, originBottom: true  },
            glow:   { scale: 1.15, alpha: 1.0,  shadow: { blur: 6 * s, color: 'white' }, originBottom: false },
            glowUp: { scale: 1.15, alpha: 1.0,  shadow: { blur: 6 * s, color: 'white' }, originBottom: true  },
        };
        this._highlightStyle = presets[style];
    }

    renderHighlight() {
        if (!this.highlighted || !this.imageLoaded) { return; }
        const { scale, alpha, shadow, originBottom } = this._highlightStyle;
        const cx = this.position.x + this.width / 2;
        const cy = originBottom
            ? this.position.y + this.height
            : this.position.y + this.height / 2;
        ctx.translate( cx,  cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        if (alpha < 1) ctx.globalAlpha = alpha;
        if (shadow) {
            ctx.shadowColor = shadow.color;
            ctx.shadowBlur  = shadow.blur;
        }
    }

    // Pure check if cursor is over box (no side effects)
    isCursorHover(box) {
        if (!this.imageLoaded) return false;
        const cursor = gameServices.cursorSystem;
        if (cursor.blocked) return false;
        return (
            cursor.canvasPosition.x >= box.position.x &&
            cursor.canvasPosition.x <= box.position.x + box.width &&
            cursor.canvasPosition.y >= box.position.y &&
            cursor.canvasPosition.y <= box.position.y + box.height
        );
    }

    isCursorHoverScreen(box) {
        if (!this.imageLoaded) return false;
        const cursor = gameServices.cursorSystem;
        if (cursor.blocked) return false;
        return (
            cursor.screenPosition.x >= box.position.x &&
            cursor.screenPosition.x <= box.position.x + box.width &&
            cursor.screenPosition.y >= box.position.y &&
            cursor.screenPosition.y <= box.position.y + box.height
        );
    }

    // Makes object hoverable (highlights on hover, calls onClick on click)
    hoverable({object, onClick}) {
        if (this.isCursorHover(object)) {
            this.highlighted = true;
            if (!gameServices.inputSystem.actions.select.previousPressed && gameServices.inputSystem.actions.select.pressed) {
                this.selected = true;
                onClick();
            }
        } else {
            this.highlighted = false;
        }
    }

    // Makes object hoverable in screen-space coords
    hoverableScreen({object, onClick}) {
        if (this.isCursorHoverScreen(object)) {
            this.highlighted = true;
            if (!gameServices.inputSystem.actions.select.previousPressed && gameServices.inputSystem.actions.select.pressed) {
                this.selected = true;
                onClick();
            }
        } else {
            this.highlighted = false;
        }
    }
}
