// set keyboard events
function getKeyboardEvents(){
    window.addEventListener("keydown", (event) => {
        switch(event.key){
            case "w":
                keys.w.pressed = true;
                break;

            case "W":
                keys.w.pressed = true;
                break;

            case "a":
                keys.a.pressed = true;
                break;

            case "A":
                keys.a.pressed = true;
                break;

            case "d":
                keys.d.pressed = true;
                break;

            case "D":
                keys.d.pressed = true;
                break;

            case "e":
                keys.e.pressed = true;
                break;

            case "E":
                keys.e.pressed = true;
                break;

            case "r":
                keys.r.pressed = true;
                break;

            case "R":
                keys.r.pressed = true;
                break;

            case " ":
                keys.space.pressed = true;
                break;

            case "Shift":
                keys.shift.pressed = true;
                break;
        };
    });
    window.addEventListener("keyup", (event) => {
        switch(event.key){
            case "w":
                keys.w.pressed = false;
                break;

            case "W":
                keys.w.pressed = false;
                break;

            case "a":
                keys.a.pressed = false;
                break;

            case "A":
                keys.a.pressed = false;
                break;

            case "d":
                keys.d.pressed = false;
                break;

            case "D":
                keys.d.pressed = false;
                break;

            case "e":
                keys.e.pressed = false;
                break;

            case "E":
                keys.e.pressed = false;
                break;

            case "r":
                keys.r.pressed = false;
                break;

            case "R":
                keys.r.pressed = false;
                break;

            case " ":
                keys.space.pressed = false;
                break;
                
            case "Shift":
                keys.shift.pressed = false;
                break;
        };
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