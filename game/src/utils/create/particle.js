// create particle
function createParticle(key){
    // Particle creation is now handled by the ParticleSystem
    // This function maintains compatibility with existing code
    const particle = new Particle({ ...data.particles[key] });

    return particle;
};
