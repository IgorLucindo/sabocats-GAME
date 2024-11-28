class Mouse{
    constructor(){
        this.down = false;
        this.move = false;
        this.event = undefined;
        this.canvasPosition = {x: 0, y: 0};
        this.gridPosition = {x: 0, y: 0};
        this.previousGridPosition = {x: 0, y: 0};
        this.mouse1 = {pressed: false, previousPressed: false};
        this.mouse2 = {pressed: false};

        this.camerabox = {
            position: {x: 0, y: 0},
            width: 150,
            height: 150
        };
    };



    // update
    update(){
        this.updateCamerabox();
        camera.panCamera({object: this.camerabox});
    };



    // render
    render(){
        if(debugMode){
            ctx.fillStyle = "rgba(0, 255, 0, .1)";
            ctx.fillRect(this.camerabox.position.x, this.camerabox.position.y, this.camerabox.width, this.camerabox.height);
        }
    };



    // update camerabox
    updateCamerabox(){
        this.camerabox.position = {
            x: this.canvasPosition.x - this.camerabox.width/2,
            y: this.canvasPosition.y - this.camerabox.height/2
        };
    };



    // show cursor
    showCursor(type = "default"){
        const body = document.getElementsByTagName("body")[0];
        body.style.cursor = "url('assets/textures/cursors/red/" + type + ".png'), auto";
    };



    // hide cursor
    hideCursor(){
        if(!debugMode){
            const body = document.getElementsByTagName("body")[0];
            body.style.cursor = "none";
        }
    };



    // reset properties
    resetProperties(){
        this.camerabox.width = 150;
        this.camerabox.height = 150;
    };
};