// Set keyboard events
function getKeyboardEvents() {
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


// Mouse events
function mouseEventsUpdate() {
    if(mouse.down) {
        // mouse down events
        if(mouse.event.button == 0) {mouse.mouse1.pressed = true;}
        else if(mouse.event.button == 2) {
            mouse.mouse2.pressed = true;
            mouse.canvasPosition.x = mouse.event.x / camera.zoom - camera.position.x;
            mouse.canvasPosition.y = mouse.event.y / camera.zoom - camera.position.y;
            if(grid) {
                mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/properties.tileSize);
                mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/properties.tileSize);
            }
        }
    }
    else if(mouse.event) {
        if(mouse.event.button == 0) {mouse.mouse1.pressed = false;}
        else if(mouse.event.button == 2) {mouse.mouse2.pressed = false;}
    }
    if(mouse.move || camera.move.x || camera.move.y) {
        // Mouse move events
        mouse.canvasPosition.x = mouse.event.x / camera.zoom - camera.position.x;
        mouse.canvasPosition.y = mouse.event.y / camera.zoom - camera.position.y;
        if(grid) {
            mouse.gridPosition.x = Math.floor((mouse.canvasPosition.x - grid.position.x)/properties.tileSize);
            mouse.gridPosition.y = Math.floor((mouse.canvasPosition.y - grid.position.y)/properties.tileSize);
        }
    }
    mouse.move = false;
}

// Mouse move function
function mouseMove(event) {
    mouse.move = true;
    mouse.event = event;
}

// Set mouse events
function getMouseEvents() {
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mousedown", (e) => {
        mouse.down = true;
        mouse.event = e;
    });
    window.addEventListener("mouseup", (e) => {
        mouse.down = false;
        mouse.event = e;
    });
    window.addEventListener("contextmenu", (e) => {e.preventDefault()});
};

// Reset mouse events
function resetMouseEvents() {
    window.addEventListener("mousemove", mouseMove);
};

// Remove mouse events
function removeMouseEvents() {
    window.removeEventListener("mousemove", mouseMove);
};