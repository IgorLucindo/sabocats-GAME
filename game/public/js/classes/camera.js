class Camera{
    constructor(){
        this.position = {x: 0, y: 0};
        this.velocity = {x: 0, y: 0};
        this.acceleration = .3 * playerScale;
        this.deceleration = .2 * playerScale;
        this.maxVelocity = 4 * playerScale;
        this.move = false;
    };



    // update camera
    update(){
        this.cameraDeceleration();
        this.position.x -= Math.round(this.velocity.x/playerScale)*playerScale;
        this.position.y -= Math.round(this.velocity.y/playerScale)*playerScale;
        // set camera move state
        if(this.velocity.x == 0 && this.velocity.y == 0){this.move = false;}
        else{this.move = true;}
    };



    // camera deceleration
    cameraDeceleration(){
        if(this.velocity.x > this.deceleration){this.velocity.x -= this.deceleration;}
        else if(this.velocity.x < -this.deceleration){this.velocity.x += this.deceleration;}
        else{this.velocity.x = 0;}

        if(this.velocity.y > this.deceleration){this.velocity.y -= this.deceleration;}
        else if(this.velocity.y < -this.deceleration){this.velocity.y += this.deceleration;}
        else{this.velocity.y = 0;}
    };



    // pan camera functions
    panCameraLeft({object}){
        const cameraRightSide = -camera.position.x + scaledCanvas.width;
        if(cameraRightSide >= background.width){
            camera.position.x = -(background.width - scaledCanvas.width);
            return;
        }
        const cameraboxRightSide = object.position.x + object.width;
        if(cameraboxRightSide >= scaledCanvas.width - camera.position.x){
            if(object.velocity.x > camera.maxVelocity && camera.velocity.x < object.velocity.x){
                camera.velocity.x += camera.acceleration*object.velocity.x/camera.maxVelocity;
            }
            else if(camera.velocity.x < camera.maxVelocity){camera.velocity.x += camera.acceleration;}
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
            if(object.velocity.x < -camera.maxVelocity && camera.velocity.x > object.velocity.x){
                camera.velocity.x -= camera.acceleration*object.velocity.x/(-camera.maxVelocity);
            }
            else if(camera.velocity.x > -camera.maxVelocity){camera.velocity.x -= camera.acceleration;}
            
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
            if(object.velocity.y > camera.maxVelocity && camera.velocity.y < object.velocity.y){
                camera.velocity.y += camera.acceleration*object.velocity.y/camera.maxVelocity;
            }
            else if(camera.velocity.y < camera.maxVelocity){camera.velocity.y += camera.acceleration;}
            
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
            if(object.velocity.y < -camera.maxVelocity && camera.velocity.y > object.velocity.y){
                camera.velocity.y -= camera.acceleration*object.velocity.y/(-camera.maxVelocity);
            }
            else if(camera.velocity.y > -camera.maxVelocity){camera.velocity.y -= camera.acceleration;}
        }
    };



    // reset properties
    resetProperties(){
        this.acceleration = .3 * playerScale;
        this.deceleration = .2 * playerScale;
        this.maxVelocity = 4 * playerScale;
    };
};