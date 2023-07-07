class Camera{
    constructor(){
        this.position = {x: 0, y: 0};
        this.destPosition = {x: 0, y: 0};
        this.zoom = 1;
        this.destZoom = 1;
        this.maxZoom = 1;
        this.minZoom = 2/3;
        this.move = {x: false, y: false};
    };



    // update camera
    update(){
        this.updatePosition();
        this.updateZoom();
    };



    // update position
    updatePosition(){
        this.position.x = -lerp(-this.position.x, this.destPosition.x, .05);
        this.position.y = -lerp(-this.position.y, this.destPosition.y, .05);
    };



    // update zoom
    updateZoom(){
        this.zoom = lerp(this.zoom, this.destZoom, .02);
        scale = this.zoom / playerScale;
        scaledCanvas.width = canvas.width / scale;
        scaledCanvas.height = canvas.height / scale;
    };



    // set camera position
    setPosition({position = {x: 0, y: 0}, key = undefined}){
        this.moveCamera({position: position, key: key});
        this.position.x = -this.destPosition.x;
        this.position.y = -this.destPosition.y;
    };



    // move camera to position
    moveCamera({position = {x: 0, y: 0}, key = undefined}){
        let newPosition = position;
        switch(key){
            case "middle":
                newPosition.x = (background.width - scaledCanvas.width)/2;
                newPosition.y = (background.height - scaledCanvas.height)/2;
                break;
            case "start":
                newPosition.x = 0;
                newPosition.y = background.height - scaledCanvas.height;
                break;
        };
        this.destPosition.x = newPosition.x;
        this.destPosition.y = newPosition.y;
    };



    // set zoom
    setZoom(zoom){
        this.destZoom = zoom;
    };



    // pan camera
    panCamera({object}){
        this.move.x = false;
        this.move.y = false;

        this.panCameraLeft({object: object});
        if(!this.move.x){this.panCameraRight({object: object});}
        this.panCameraTop({object: object});
        if(!this.move.y){this.panCameraBottom({object: object});}
    };
    panCameraLeft({object}){
        const cameraboxRightSide = object.position.x + object.width;
        if(cameraboxRightSide >= scaledCanvas.width - this.position.x){
            this.move.x = true;
            const newPositionX = Math.min(cameraboxRightSide - scaledCanvas.width, background.width - scaledCanvas.width);
            this.destPosition.x = newPositionX;
        }
    };
    panCameraRight({object}){
        const cameraboxLeftSide = object.position.x;
        if(cameraboxLeftSide <= -this.position.x){
            this.move.x = true;
            const newPositionX = Math.max(cameraboxLeftSide, 0);
            this.destPosition.x = newPositionX;
        }
    };
    panCameraTop({object}){
        const cameraboxBottomSide = object.position.y + object.height;
        if(cameraboxBottomSide >= scaledCanvas.height - this.position.y){
            this.move.y = true;
            const newPositionY = Math.min(cameraboxBottomSide - scaledCanvas.height, background.height - scaledCanvas.height);
            this.destPosition.y = newPositionY;
        }
    };
    panCameraBottom({object}){
        const cameraboxTopSide = object.position.y;
        if(cameraboxTopSide <= -this.position.y){
            this.move.y = true;
            const newPositionY = Math.max(cameraboxTopSide, 0);
            this.destPosition.y = newPositionY;
        }
    };
};