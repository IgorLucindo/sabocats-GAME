class Mouse{
    constructor(){
        this.down = false;
        this.move = false;
        this.event = undefined;
        this.canvasPosition = {x: 0, y: 0};
        this.previousCanvasPosition = {x: 0, y: 0};
        this.gridPosition = {x: 0, y: 0};
        this.previousGridPosition = {x: 0, y: 0};
        this.mouse1 = {pressed: false, previousPressed: false};
        this.mouse2 = {pressed: false};

        this.camerabox = {
            position: {x: 0, y: 0},
            velocity: {x: 0, y: 0},
            width: 150 * playerScale,
            height: 150 * playerScale
        };
    };



    // update mouse
    update(){
        this.updateCamerabox();
        c.fillStyle = "rgba(0, 255, 0, .1)";
        c.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        // pan camera
        camera.panCameraLeft({object: this.camerabox});
        camera.panCameraRight({object: this.camerabox});
        camera.panCameraTop({object: this.camerabox});
        camera.panCameraBottom({object: this.camerabox});
    };



    // update camerabox
    updateCamerabox(){
        this.camerabox.position = {
            x: this.canvasPosition.x - this.camerabox.width/2,
            y: this.canvasPosition.y - this.camerabox.height/2
        };
        this.camerabox.velocity = {
            x: this.canvasPosition.x - this.previousCanvasPosition.x,
            y: this.canvasPosition.y - this.previousCanvasPosition.y
        };
    };



    // show cursor
    showCursor(type = "default"){
        const body = document.getElementsByTagName("body")[0];
        body.style.cursor = "url('../assets/images/cursors/red/" + type + ".png'), auto";
    };



    // hide cursor
    hideCursor(){
        // const body = document.getElementsByTagName("body")[0];
        // body.style.cursor = "none";
    };



    // reset properties
    resetProperties(){
        this.camerabox.width = 150 * playerScale;
        this.camerabox.height = 150 * playerScale;
    };
};