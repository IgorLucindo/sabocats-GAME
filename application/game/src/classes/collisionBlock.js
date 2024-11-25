// collisionBlock class
class CollisionBlock{
    constructor({position, width, height, death = false, placingPhaseCollision = true}){
        this.position = position;
        this.width = width;
        this.height = height;
        this.death = death;
        if(death){this.wallSlide = false;}
        else{this.wallSlide = true;};
        this.placingPhaseCollision = placingPhaseCollision;
    };

    draw(){
        if(debugMode){
            ctx.fillStyle = "rgba(255, 0, 0, .3)";
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    };

    render(){
        this.draw();
    };
};