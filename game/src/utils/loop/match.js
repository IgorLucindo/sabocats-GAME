function matchLoop() {
    // Update objects
    for(let i in match.objects) {
        match.objects[i].update();
    };

    // Update for each match state
    switch(match.state) {
        case "choosing":
            // Update box
            box.update();

            // Update objects in box
            for(let i in box.objects) {
                box.objects[i].updateInChoosing();
            };
            break;

        case "placing":
            // Update mouse
            mouse.update();
            
            // Update objects in box
            for(let i in box.objects) {
                box.objects[i].updateInPlacing();
            };
            break;

        case "playing":
            // Call function or trigger event for game over state
            break;
    };

    // Update match
    match.update();
    match.updateInStateChange();
}