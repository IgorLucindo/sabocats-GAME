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
        const cameraboxRightSide = object.position.x + object.width;
        if(cameraboxRightSide >= scaledCanvas.width - this.position.x){
            this.move.x = true;
            const newPositionX = Math.min(cameraboxRightSide - scaledCanvas.width, background.width - scaledCanvas.width);
            this.destinationPosition.x = newPositionX;
        }
    };
    panCameraRight({object}){
        const cameraboxLeftSide = object.position.x;
        if(cameraboxLeftSide <= -this.position.x){
            this.move.x = true;
            const newPositionX = Math.max(cameraboxLeftSide, 0);
            this.destinationPosition.x = newPositionX;
        }
    };
    panCameraTop({object}){
        const cameraboxBottomSide = object.position.y + object.height;
        if(cameraboxBottomSide >= scaledCanvas.height - this.position.y){
            this.move.y = true;
            const newPositionY = Math.min(cameraboxBottomSide - scaledCanvas.height, background.height - scaledCanvas.height);
            this.destinationPosition.y = newPositionY;
        }
    };
    panCameraBottom({object}){
        const cameraboxTopSide = object.position.y;
        if(cameraboxTopSide <= -this.position.y){
            this.move.y = true;
            const newPositionY = Math.max(cameraboxTopSide, 0);
            this.destinationPosition.y = newPositionY;
        }
    };
};