// layer class
class Layer extends Sprite{
    constructor({position, width, parallaxSpeed = 0, grid = false, imageSrc}){
        super({position, imageSrc});
        this.width = width;
        this.parallaxSpeed = parallaxSpeed;
        this.grid = grid;
    };



    // update layer
    update(){
        this.parallax();
    };

    render(){
        ctx.save();

        if(this.grid){
            if(match.state === "choosing" || match.state === "placing"){
                ctx.filter = "opacity(.6)";
                this.draw();
            }
        }
        else{this.draw();}
        
        ctx.restore();
    };

    parallax(){
        this.position.x = -camera.position.x * this.parallaxSpeed;
    };
};