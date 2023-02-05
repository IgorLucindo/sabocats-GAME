// collisionBlock class
class CollisionBlock{
    constructor({position, tileSide = null, width = null, height = null}){
        this.position = position;
        this.width = width;
        if(this.width == null){this.width = tileSide;}
        this.height = height;
        if(this.height == null){this.height = tileSide;}
    };

    draw(){
        c.fillStyle = "rgba(255, 0, 0, .5)";
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    };

    update(){
        this.draw();
    }
}