// SoundSystem — Web Audio API based sound player.
// Uses AudioBuffers for low-latency playback (multiple simultaneous instances supported).
// Buffers load fire-and-forget in initialize(); play() silently skips if not ready yet.

import { gameServices } from '../core/GameServices.js';

export class SoundSystem {
    constructor(soundsData) {
        this._actx    = null;
        this._buffers = {};
        this._data    = soundsData;
    }

    // Preload all AudioBuffers — called automatically by SystemManager.initializeAll()
    initialize() {
        this._actx = new (window.AudioContext || window.webkitAudioContext)();

        for (const [id, sound] of Object.entries(this._data)) {
            fetch(sound.src)
                .then(r => {
                    if (!r.ok) { throw new Error(`SoundSystem: failed to fetch ${sound.src}`); }
                    return r.arrayBuffer();
                })
                .then(buf => this._actx.decodeAudioData(buf))
                .then(decoded => { this._buffers[id] = decoded; });
        }
    }

    // Play a sound by id. Safe to call even if not yet loaded.
    play(id) {
        const buf = this._buffers[id];
        if (!buf) { return; }

        // Resume context if browser suspended it (autoplay policy)
        if (this._actx.state === 'suspended') { this._actx.resume(); }

        const source = this._actx.createBufferSource();
        source.buffer = buf;

        const gain = this._actx.createGain();
        gain.gain.value = this._data[id].volume ?? 1;

        source.connect(gain);
        gain.connect(this._actx.destination);
        source.start(0);
    }

    // Play a world sound with proximity check.
    // broadcast: true  → emitter side: always plays locally + sends to remotes.
    // broadcast: false → receiver side: only plays if sourcePosition is within canvas.width/2.
    playWorld(id, sourcePosition, { broadcast = false } = {}) {
        if (broadcast) {
            this.play(id);
            gameServices.socketHandler.sendSound(id, sourcePosition);
        } else {
            const { canvas, cameraSystem } = gameServices;
            const screenCenterX = cameraSystem.position.x + canvas.width / 2;
            const screenCenterY = cameraSystem.position.y + canvas.height / 2;
            const dx = sourcePosition.x - screenCenterX;
            const dy = sourcePosition.y - screenCenterY;
            if (Math.hypot(dx, dy) <= canvas.width / 2) {
                this.play(id);
            }
        }
    }
}
