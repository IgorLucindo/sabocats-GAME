// collisionBlock class
class CollisionBlock{
    constructor({position, width, height, death = false}){
        this.position = position;
        this.width = width;
        this.height = height;
        this.death = death;
        if(death){this.wallSlide = false;}
        else{this.wallSlide = true;};
    };

    draw(){
        c.fillStyle = "rgba(255, 0, 0, .3)";
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    };

    update(){
        this.draw();
    };
};