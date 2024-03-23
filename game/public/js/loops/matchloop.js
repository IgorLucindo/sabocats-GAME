// match loop
function matchloop(){
    // update objects
    for(let i in allObjects){
        allObjects[i].update();
    };

    switch(match.state){
        case "choosing":
            // update object box
            box.update();
            break;
        case "placing":
            // update mouse
            mouse.update();
            break;
        case "playing":
            // Call function or trigger event for game over state
            break;
    };

    // check box objects
    for(let i in box.objects){
        box.objects[i].updateInBox();
    };

    // update match
    match.update();
    match.updateInStateChange();
};