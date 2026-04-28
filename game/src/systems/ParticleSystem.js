import { ctx } from '../core/RenderContext.js';
import { GameConfig, data } from '../core/DataLoader.js';
import { gameServices } from '../core/GameServices.js';
import { Sprite } from '../entities/Sprite.js';

class Particle extends Sprite {
    constructor({ position, positionFlipped, texture, frames, frameBuffer }) {
        super({ texture, frames, frameBuffer });
        this.position = { x: 0, y: 0 };
        this.offsetData = position;
        this.offsetDataFlipped = positionFlipped || null;
        this.rotation = 0;
        this.key = null;
    }

    reset() {
        this.currentFrame = 0;
        this.elapsedFrames = 0;
        this.rotation = 0;
        this.flipped = false;
        this.onComplete = null;
    }

    update() {
        this.elapsedFrames++;
        if (this.elapsedFrames % this.frameBuffer === 0 && this.currentFrame < this.frames - 1) {
            this.currentFrame++;
        }
        return this.elapsedFrames > this.frames * this.frameBuffer;
    }

    render() {
        ctx.save();
        if (this.rotation !== 0) {
            const center = { x: this.position.x + this.width / 2, y: this.position.y + this.height / 2 };
            this.drawRotated(this.rotation, center);
        } else {
            this.draw();
        }
        ctx.restore();
    }

    setPosition(position, posOverride) {
        const offset = posOverride
            || (this.offsetDataFlipped && this.flipped ? this.offsetDataFlipped : this.offsetData);
        this.position.x = position.x + offset.x;
        this.position.y = position.y + offset.y;
    }
}


export class ParticleSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.particles = [];
    this._pool = {};
  }

  add(key, position, options = {}) {
    if (this.particles.length >= this.gameConfig.particles.maxParticles) return;

    let particle;
    if (this._pool[key] && this._pool[key].length > 0) {
      particle = this._pool[key].pop();
      particle.reset();
    } else {
      particle = new Particle({ ...data.particles[key] });
      particle.key = key;
    }

    if (options.rotation) particle.rotation = options.rotation;
    if (options.flipped) particle.flipped = options.flipped;
    if (options.onComplete) particle.onComplete = options.onComplete;
    const posData = data.particles[key];
    const pos = options.position
        || (options.rotation && posData.rotatedPositions?.[options.rotation])
        || null;
    particle.setPosition(position, pos);
    this.particles.push(particle);

    if (options.broadcast) {
      const { broadcast: _, ...sendOptions } = options;
      gameServices.socketHandler.sendParticle(key, sendOptions, position);
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].update()) {
        const particle = this.particles[i];
        if (particle.onComplete) particle.onComplete();
        if (!this._pool[particle.key]) this._pool[particle.key] = [];
        this._pool[particle.key].push(particle);
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }
  }

  render() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].render();
    }
  }

  shutdown() {
    this.particles = [];
    this._pool = {};
  }

  query(question) {
    switch (question) {
      case 'particleCount': return this.particles.length;
      case 'particlesActive': return this.particles.length > 0;
      default: return null;
    }
  }
}
