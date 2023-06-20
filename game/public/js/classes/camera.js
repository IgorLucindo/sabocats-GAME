class Camera{
    constructor(){
        this.position = {x: 0, y: 0};
        this.velocity = {x: 0, y: 0};
        this.acceleration = .3 * playerScale;
        this.deceleration = .2 * playerScale;
        this.maxVelocity = 10 * playerScale;
        this.move = false;
    };



    // update camera
    update(){
        this.cameraDeceleration();
        this.position.x -= Math.round(this.velocity.x/player.scale)*player.scale;
        this.position.y -= Math.round(this.velocity.y/player.scale)*player.scale;
        // set camera move state
        if(this.velocity.x == 0 && this.velocity.y == 0){this.move = false;}
        else{this.move = true;};
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



    // reset properties
    resetProperties(){
        this.acceleration = .3 * playerScale;
        this.deceleration = .2 * playerScale;
        this.maxVelocity = 10 * playerScale;
    };
};