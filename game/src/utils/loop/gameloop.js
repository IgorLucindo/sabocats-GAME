// game loop
function gameLoop(){
    // set the delta time
    currentTime = performance.now();
    deltaTime = (currentTime - previousTime)/1000;
    previousTime = currentTime;
    // update accumulator time
    accumulatorTime += deltaTime;

    // run logic loop at a fixed tickRate
    while (accumulatorTime >= properties.tickTime){
        logicLoop();
        accumulatorTime -= properties.tickTime;
    };

    // Interpolation factor for rendering
    const interpolation = accumulatorTime / properties.tickTime;
    renderLoop();

    requestAnimationFrame(gameLoop);
};