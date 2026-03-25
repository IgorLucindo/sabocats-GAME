// Profiler - Frame timing sampler; exposes snapshot() for DebugMenu display

export class Profiler {
    constructor() {
        // Circular buffer: 60 frame time samples for rolling FPS average
        this._samples = new Array(60).fill(0);
        this._head = 0;
        this._count = 0;

        this._displayAccumulator = 0;
        this._displayInterval    = 1000; // ms between display refreshes

        this._displayFps     = 0;
        this._displayLogicMs = 0;
    }

    record(dtMs, logicMs) {
        this._samples[this._head] = dtMs;
        this._head = (this._head + 1) % 60;
        if (this._count < 60) this._count++;

        this._displayAccumulator += dtMs;
        if (this._displayAccumulator >= this._displayInterval) {
            this._displayFps     = this._fps();
            this._displayLogicMs = logicMs;
            this._displayAccumulator -= this._displayInterval;
        }
    }

    snapshot() {
        return { fps: this._displayFps, logicMs: this._displayLogicMs };
    }

    _fps() {
        if (this._count === 0) return 0;
        let total = 0;
        for (let i = 0; i < this._count; i++) total += this._samples[i];
        return Math.round(1000 / (total / this._count));
    }
}
