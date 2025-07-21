// create particle
function createParticle(key){
    const particle = new Particle({ ...data.particles[key] });

    return particle;
};