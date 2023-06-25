// sprite class
class Sprite{
    constructor({position, imageSrc, frameRate = 1, frameBuffer = 3, scale = 1, highlightUp = false}){
        this.position = position;
        this.scale = scale;
        this.imageLoaded = false;
        this.image = new Image();
        this.image.onload = () => {
            this.width = this.image.width / this.frameRate * this.scale;
            this.height = this.image.height * this.scale;
            this.imageLoaded = true;
        };
        this.image.src = imageSrc;
        this.frameRate = frameRate;
        this.currentFrame = 0;
        this.frameBuffer = frameBuffer;
        this.elapsedFrames = 0;

        this.selected = false;
        this.highlightUp = highlightUp;
    };



    // draw image
    draw(){
        if(!this.imageLoaded){return;}

        const cropbox = {
            position: {x: this.currentFrame * this.image.width / this.frameRate, y: 0},
            width: this.image.width / this.frameRate,
            height: this.image.height
        };

        c.drawImage(
            this.image,
            cropbox.position.x,
            cropbox.position.y,
            cropbox.width,
            cropbox.height,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    };



    // draw rotated image
    drawRotated(rotation){
        if(!this.imageLoaded){return;}

        const cropbox = {
            position: {x: this.currentFrame * this.image.width / this.frameRate, y: 0},
            width: this.image.width / this.frameRate,
            height: this.image.height
        };
        const translationx = Math.floor((this.width-1)/2/tileSize)*tileSize;
        const translationy = Math.floor((this.height-1)/2/tileSize)*tileSize;

        c.translate(
            this.position.x + tileSize/2 + translationx,
            this.position.y + tileSize/2 + translationy
        );
        c.rotate(rotation * Math.PI/180);
        c.drawImage(
            this.image,
            cropbox.position.x,
            cropbox.position.y,
            cropbox.width,
            cropbox.height,
            -tileSize/2 - translationx,
            -tileSize/2 - translationy,
            this.width,
            this.height
        );
    };



    // update sprite
    update(){
        this.draw();
    };
    // update frames
    updateFrames(){
        this.elapsedFrames++;
        if(this.elapsedFrames % this.frameBuffer == 0){
            if(this.currentFrame < this.frameRate - 1){this.currentFrame++;}
            else{this.currentFrame = 0;};
        }
    };



    // highlight sprite
    highlightSprite(){
        const scale = 1.1;
        c.scale(scale, scale);
        let translateX = -this.position.x*(1-1/scale) - this.width*(1-1/scale)/2;
        let translateY = -this.position.y*(1-1/scale) - this.height*(1-1/scale)/2;
        if(this.highlightUp){translateY -= this.height*(1-1/scale)/2}
        c.translate(translateX, translateY);
        c.filter = "opacity(.8) drop-shadow(0 0 0 white)";
    };



    // mouse over sprite
    mouseOver({object, method}){
        if(!this.imageLoaded){return;}
        if(mouseOverObject({object})){
            this.highlightSprite();
            if(!mouse.mouse1.previousPressed && mouse.mouse1.pressed){
                this.selected = true;
                method();
            }
        }
    };
}