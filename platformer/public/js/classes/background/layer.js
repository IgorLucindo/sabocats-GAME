// layer class
class Layer extends Sprite{
    constructor({position, width, parallaxSpeed = 0, imageSrc}){
        super({position, imageSrc});
        this.width = width;
        this.parallaxSpeed = parallaxSpeed;
        this.loadLayer = true;
    };



    // update layer
    update(){
        this.parallax();
        this.draw();
    };

    parallax(){
        this.position.x = -camera.position.x * this.parallaxSpeed;
    };
};