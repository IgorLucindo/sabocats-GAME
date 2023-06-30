class Camera{
    constructor(){
        this.position = {x: 0, y: 0};
        this.destinationPosition = {x: 0, y: 0};
        this.move = {x: false, y: false};
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



    // set camera position
    setPosition({position = {x: 0, y: 0}, middle = false}){
        let newPosition = position;
        if(middle){
            newPosition.x = (background.width - scaledCanvas.width)/2;
            newPosition.y = (background.height - scaledCanvas.height)/2;
        }
        this.position.x = -newPosition.x;
        this.position.y = -newPosition.y;
        this.destinationPosition.x = newPosition.x;
        this.destinationPosition.y = newPosition.y;
    };



    // move camera to position
    moveCamera({position = {x: 0, y: 0}, middle = false}){
        let newPosition = position;
        if(middle){
            newPosition.x = (background.width - scaledCanvas.width)/2;
            newPosition.y = (background.height - scaledCanvas.height)/2;
        }
        this.destinationPosition.x = newPosition.x;
        this.destinationPosition.y = newPosition.y;
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
        const cameraRightSide = -this.position.x + scaledCanvas.width;
        if(cameraRightSide >= background.width){
            this.position.x = -background.width + scaledCanvas.width;
            this.destinationPosition.x = -this.position.x;
            return;
        }

        const cameraboxRightSide = object.position.x + object.width;
        if(cameraboxRightSide >= scaledCanvas.width - this.position.x){
            this.move.x = true;
            this.destinationPosition.x = cameraboxRightSide - scaledCanvas.width;
        }
    };
    panCameraRight({object}){
        const cameraLeftSide = -this.position.x;
        if(cameraLeftSide <= 0){
            this.position.x = 0;
            this.destinationPosition.x = -this.position.x;
            return;
        }

        const cameraboxLeftSide = object.position.x;
        if(cameraboxLeftSide <= -this.position.x){
            this.move.x = true;
            this.destinationPosition.x = cameraboxLeftSide;
        }
    };
    panCameraTop({object}){
        const cameraTopSide = -this.position.y + scaledCanvas.height;
        if(cameraTopSide >= background.height){
            this.position.y = -background.height + scaledCanvas.height;
            this.destinationPosition.y = -this.position.y;
            return;
        }

        const cameraboxTopSide = object.position.y + object.height;
        if(cameraboxTopSide >= scaledCanvas.height - this.position.y){
            this.move.y = true;
            this.destinationPosition.y = cameraboxTopSide - scaledCanvas.height;
        }
    };
    panCameraBottom({object}){
        const cameraBottomSide = -this.position.y;
        if(cameraBottomSide <= 0){
            this.position.y = 0;
            this.destinationPosition.y = -this.position.y;
            return;
        }

        const cameraboxBottomSide = object.position.y;
        if(cameraboxBottomSide <= -this.position.y){
            this.move.y = true;
            this.destinationPosition.y = cameraboxBottomSide;
        }
    };
};