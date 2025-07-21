function gameLoop() {
    // Set the delta time
    currentTime = performance.now();
    deltaTime = (currentTime - previousTime)/1000;
    previousTime = currentTime;

    // Update accumulator time
    accumulatorTime += deltaTime;

    // Run logic loop at a fixed tickRate
    while (accumulatorTime >= properties.tickTime) {
        logicLoop();
        accumulatorTime -= properties.tickTime;
    };

    // Interpolation factor for rendering
    const interpolation = accumulatorTime / properties.tickTime;
    renderLoop();

    requestAnimationFrame(gameLoop);
}