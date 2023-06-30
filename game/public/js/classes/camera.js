class Camera{
    constructor(){
        this.position = {x: 0, y: 0};
        this.destinationPosition = {x: 0, y: 0};
        this.move = false;
    };



    // update camera
    update(){
        this.updatePosition();
    };



    // update position
    updatePosition(){
        this.position.x = -lerp({
            currentValue: -this.position.x,
            destinationValue: this.destinationPosition.x,
            speed: .05
        });
        this.position.y = -lerp({
            currentValue: -this.position.y,
            destinationValue: this.destinationPosition.y,
            speed: .05
        });
    };



    // move camera to position
    moveCamera({position}){
        this.destinationPosition.x = position.x;
        this.destinationPosition.y = position.y;
    };



    // pan camera
    panCamera({object}){
        this.move = false;
        this.panCameraLeft({object: object});
        this.panCameraRight({object: object});
        this.panCameraTop({object: object});
        this.panCameraBottom({object: object});
    };
    panCameraLeft({object}){
        const cameraRightSide = -camera.position.x + scaledCanvas.width;
        if(cameraRightSide >= background.width){
            camera.position.x = -(background.width - scaledCanvas.width);
            return;
        }

        const cameraboxRightSide = object.position.x + object.width;
        if(cameraboxRightSide >= scaledCanvas.width - camera.position.x){
            this.move = true;
            this.destinationPosition.x = cameraboxRightSide - scaledCanvas.width;
        }
    };
    panCameraRight({object}){
        const cameraLeftSide = -camera.position.x;
        if(cameraLeftSide <= 0){
            camera.position.x = 0;
            return;
        }

        const cameraboxLeftSide = object.position.x;
        if(cameraboxLeftSide <= -camera.position.x){
            this.move = true;
            this.destinationPosition.x = cameraboxLeftSide;
        }
    };
    panCameraTop({object}){
        const cameraTopSide = -camera.position.y + scaledCanvas.height;
        if(cameraTopSide >= background.height){
            camera.position.y = -(background.height - scaledCanvas.height);
            return;
        }

        const cameraboxTopSide = object.position.y + object.height;
        if(cameraboxTopSide >= scaledCanvas.height - camera.position.y){
            this.move = true;
            this.destinationPosition.y = cameraboxTopSide - scaledCanvas.height;
        }
    };
    panCameraBottom({object}){
        const cameraBottomSide = -camera.position.y;
        if(cameraBottomSide <= 0){
            camera.position.y = 0;
            return;
        }

        const cameraboxBottomSide = object.position.y;
        if(cameraboxBottomSide <= -camera.position.y){
            this.move = true;
            this.destinationPosition.y = cameraboxBottomSide;
        }
    };
};