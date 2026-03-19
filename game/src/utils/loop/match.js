function matchLoop() {
    // Update objects
    for(let i in match.objects) {
        match.objects[i].update();
    };

    // Update state-specific logic (delegated to state handler)
    matchStateMachine.update();

    // Update match
    match.update();
    match.updateInStateChange();
}