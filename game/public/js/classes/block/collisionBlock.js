// collisionBlock class
class CollisionBlock{
    constructor({position, tileSide = null, width = null, height = null}){
        this.position = position;
        this.width = width;
        this.height = height;
        if(!this.width){this.width = tileSide;}
        if(!this.height){this.height = tileSide;}
    };

    draw(){
        c.fillStyle = "rgba(255, 0, 0, .3)";
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    };

    update(){
        this.draw();
    };
};