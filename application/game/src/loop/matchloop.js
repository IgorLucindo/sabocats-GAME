// match loop
function matchloop(){
    // update objects
    for(let i in match.objects){
        match.objects[i].update();
    };

    // update for each match state
    switch(match.state){
        case "choosing":
            // update box
            box.update();

            // update objects in box
            for(let i in box.objects){
                box.objects[i].updateInChoosing();
            };
            break;

        case "placing":
            // update mouse
            mouse.update();
            
            // update objects in box
            for(let i in box.objects){
                box.objects[i].updateInPlacing();
            };
            break;

        case "playing":
            // Call function or trigger event for game over state
            break;
    };

    // update match
    match.update();
    match.updateInStateChange();
};