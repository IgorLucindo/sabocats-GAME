class Particle extends Sprite {
    constructor({ relativePosition, texture, frameRate, frameBuffer }) {
        super({ texture, frameRate, frameBuffer, scale: properties.pixelScale });
        this.position = { x: 0, y: 0 };
        this.relativePosition = relativePosition;
    }

    update() {
        return this.currentFrame === this.frameRate - 1;
    }

    render() {
        ctx.save();
        this.updateFrames();
        this.draw();
        ctx.restore();
    }

    setPosition(player) {
        this.position.x = player.position.x + this.relativePosition.x;
        this.position.y = player.position.y + this.relativePosition.y;
    }
}


class ParticleSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.particles = [];
  }

  add(key, player) {
    if (this.particles.length >= this.gameConfig.particles.maxParticles) return;
    const particle = new Particle({ ...data.particles[key] });
    particle.setPosition(player);
    this.particles.push(particle);
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (this.particles[i].update()) {
        this.particles.splice(i, 1);
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
  }

  query(question) {
    switch (question) {
      case 'particleCount': return this.particles.length;
      case 'particlesActive': return this.particles.length > 0;
      default: return null;
    }
  }
}
