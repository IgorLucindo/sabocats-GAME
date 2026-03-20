// ParticleSystem - Centralized particle lifecycle management

class ParticleSystem {
  constructor({ gameConfig, entityFactory }) {
    this.gameConfig = gameConfig;
    this.entityFactory = entityFactory;
    this.particles = [];
  }

  initialize() {
    // Initialize particle list from gameState if available
    // Otherwise will be populated by addParticle calls
  }

  update(deltaTime = null) {
    // Particles update themselves, this is for system-level management
    // Could be used for particle pooling or batch updates in future
  }

  shutdown() {
    // Clear all particles
    this.particles = [];
  }

  /**
   * Create and add a particle to the system
   * @param {string} particleKey - Key of particle type to create
   * @param {Object} position - {x, y} position for particle
   * @returns {Particle} - Created particle instance
   */
  createParticle(particleKey, position) {
    const particle = this.entityFactory.createParticle(particleKey);
    if (particle) {
      particle.position = { ...position };
      this.particles.push(particle);
    }
    return particle;
  }

  /**
   * Add existing particle to system
   * @param {Particle} particle - Particle instance
   */
  addParticle(particle) {
    if (particle && !this.particles.includes(particle)) {
      this.particles.push(particle);
    }
  }

  /**
   * Remove particle from system
   * @param {Particle} particle - Particle to remove
   */
  removeParticle(particle) {
    const index = this.particles.indexOf(particle);
    if (index > -1) {
      this.particles.splice(index, 1);
    }
  }

  /**
   * Update all particles
   * @param {Array} particleArray - Array of particles to update (from gameState)
   */
  updateParticles(particleArray) {
    if (!particleArray) return;

    // Update each particle
    for (let i = particleArray.length - 1; i >= 0; i--) {
      const particle = particleArray[i];

      if (particle.update) {
        particle.update();
      }

      // Remove particle if it's done
      if (particle.finished) {
        particleArray.splice(i, 1);
      }
    }
  }

  /**
   * Get all active particles
   * @returns {Array} - Array of active particles
   */
  getActiveParticles() {
    return [...this.particles];
  }

  /**
   * Get particle count
   * @returns {number} - Number of active particles
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  clearAllParticles() {
    this.particles = [];
  }

  query(question) {
    switch (question) {
      case 'particleCount':
        return this.getParticleCount();
      case 'particlesActive':
        return this.particles.length > 0;
      default:
        return null;
    }
  }
}

// Create singleton instance (initialized in GameServices)
let particleSystem;
