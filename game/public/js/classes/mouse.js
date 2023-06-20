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
        this.panCameraLeft();
        this.panCameraRight();
        this.panCameraTop();
        this.panCameraBottom();
    };



    // update camerabox
    updateCamerabox(){
        this.camerabox.position = {
            x: this.canvasPosition.x - this.camerabox.width/2,
            y: this.canvasPosition.y - this.camerabox.height/2
        };
    };



    // pan camera functions
    panCameraLeft(){
        const cameraRightSide = -camera.position.x + scaledCanvas.width;
        if(cameraRightSide >= background.width){
            camera.position.x = -(background.width - scaledCanvas.width);
            return;
        }
        const cameraboxRightSide = this.camerabox.position.x + this.camerabox.width;
        if(cameraboxRightSide >= scaledCanvas.width - camera.position.x &&
           camera.velocity.x < camera.maxVelocity){
            camera.velocity.x += camera.acceleration;
        }
    };
    panCameraRight(){
        const cameraLeftSide = -camera.position.x;
        if(cameraLeftSide <= 0){
            camera.position.x = 0;
            return;
        }
        const cameraboxLeftSide = this.camerabox.position.x;
        if(cameraboxLeftSide <= -camera.position.x &&
           camera.velocity.x > -camera.maxVelocity){
            camera.velocity.x -= camera.acceleration;
        }
    };
    panCameraTop(){
        const cameraTopSide = -camera.position.y + scaledCanvas.height;
        if(cameraTopSide >= background.height){
            camera.position.y = -(background.height - scaledCanvas.height);
            return;
        }
        const cameraboxTopSide = this.camerabox.position.y + this.camerabox.height;
        if(cameraboxTopSide >= scaledCanvas.height - camera.position.y &&
           camera.velocity.y < camera.maxVelocity){
            camera.velocity.y += camera.acceleration;
        }
    };
    panCameraBottom(){
        const cameraBottomSide = -camera.position.y;
        if(cameraBottomSide <= 0){
            camera.position.y = 0;
            return;
        }
        const cameraboxBottomSide = this.camerabox.position.y;
        if(cameraboxBottomSide <= -camera.position.y &&
           camera.velocity.y > -camera.maxVelocity){
            camera.velocity.y -= camera.acceleration;
        }
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