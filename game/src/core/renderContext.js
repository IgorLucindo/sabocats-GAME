// Shared render context — populated once via renderContext.init(), read by all draw code.
// ctx, canvas, scaledCanvas, debugMode, smoothZoom are module-level live bindings so all
// consumers can do `import { ctx }` and always see the current value without extra indirection.

export let ctx        = null;
export let canvas     = null;
export let debugMode  = false;
export let smoothZoom = true;
export const scaledCanvas = { width: 0, height: 0 };

class RenderContext {
    constructor() {
        this._mainCtx  = null;
        this._offCanvas = null;
        this._offCtx    = null;
    }

    init(cvs, context, dm) {
        canvas        = cvs;
        ctx           = context;
        this._mainCtx = context;
        debugMode     = dm;
        this._offCanvas = document.createElement('canvas');
        this._offCtx    = this._offCanvas.getContext('2d');
    }

    setSmoothZoom(on) {
        smoothZoom = on;
    }

    // Switches ctx to the off-screen canvas (smooth-zoom mode) or keeps it on the main canvas.
    // Call once at the start of each render pass before any drawing.
    beginFrame(zoom) {
        if (smoothZoom) {
            const w = Math.ceil(canvas.width  / zoom);
            const h = Math.ceil(canvas.height / zoom);
            if (this._offCanvas.width !== w || this._offCanvas.height !== h) {
                this._offCanvas.width  = w;
                this._offCanvas.height = h;
            }
            this._offCtx.imageSmoothingEnabled = false;
            ctx = this._offCtx;
        } else {
            ctx = this._mainCtx;
        }
    }

    // Blits the off-screen canvas to the main canvas with bilinear filtering (smooth-zoom mode only).
    // Call once at the end of each render pass after all world-space drawing.
    endFrame() {
        if (smoothZoom) {
            ctx = this._mainCtx;
            this._mainCtx.imageSmoothingEnabled = true;
            this._mainCtx.imageSmoothingQuality = 'high';
            this._mainCtx.drawImage(this._offCanvas, 0, 0, canvas.width, canvas.height);
            this._mainCtx.imageSmoothingEnabled = false;
        }
    }
}

export const renderContext = new RenderContext();
