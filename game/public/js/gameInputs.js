// set keyboard events
function getKeyboardEvents(){
    // key down
    window.addEventListener("keydown", (event) => {
        let key = event.key.toLowerCase();
        if(key === " "){key = "space";}

        // skip if key is not in keys
        if(!keys[key]){return;}

        // set pressed key as true
        keys[key].pressed = true;
    });

    // key up
    window.addEventListener("keyup", (event) => {
        let key = event.key.toLowerCase();
        if(key === " "){key = "space";}

        // skip if key is not in keys
        if(!keys[key]){return;}

        // set pressed key as false
        keys[key].pressed = false;
    });
};



// mouse events
function mouseEventsUpdate(){
    // mouse down events
    if(mouse.down){
        if(mouse.event.button == 0){mouse.mouse1.pressed = true;}
        else if(mouse.event.button == 2){
            mouse.mouse2.pressed = true;
            mouse.canvasPosition.x = mouse.event.x/scale - camera.position.x;
            mouse.canvasPosition.y = mouse.event.y/scale - camera.position.y;
            if(grid){
                mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/tileSize);
                mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/tileSize);
            }
        }
    }
    else if(mouse.event){
        if(mouse.event.button == 0){mouse.mouse1.pressed = false;}
        else if(mouse.event.button == 2){mouse.mouse2.pressed = false;}
    }
    // mouse move events
    if(mouse.move || camera.move.x || camera.move.y){
        mouse.canvasPosition.x = mouse.event.x/scale - camera.position.x;
        mouse.canvasPosition.y = mouse.event.y/scale - camera.position.y;
        if(grid){
            mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/tileSize);
            mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/tileSize);
        }
    }
    mouse.move = false;
};
// mouse move function
function mouseMove(event){
    mouse.move = true;
    mouse.event = event;
};
// set mouse events
function getMouseEvents(){
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mousedown", (event) => {
        mouse.down = true;
        mouse.event = event;
    });
    window.addEventListener("mouseup", (event) => {
        mouse.down = false;
        mouse.event = event;
    });
    window.addEventListener("contextmenu", (event) => {event.preventDefault()});
};
// reset mouse events
function resetMouseEvents(){
    window.addEventListener("mousemove", mouseMove);
};
// remove mouse events
function removeMouseEvents(){
    window.removeEventListener("mousemove", mouseMove);
};