// layer class
class Layer extends Sprite{
    constructor({position, width, parallaxSpeed = 0, grid = false, imageSrc}){
        super({position, imageSrc});
        this.width = width;
        this.parallaxSpeed = parallaxSpeed;
        this.grid = grid;
        this.loadLayer = true;
    };



    // update layer
    update(){
        c.save();
        this.parallax();
        if(this.grid){this.updateGrid();}
        this.draw();
        c.restore();
    };

    updateGrid(){
        c.filter = "opacity(.6)";
    };

    parallax(){
        this.position.x = -camera.position.x * this.parallaxSpeed;
    };

    
};