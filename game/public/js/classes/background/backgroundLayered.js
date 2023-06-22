// background layered class
class BackgroundLayered{
    constructor({width, height, images, objects, icon}){
        this.width = width;
        this.height = height

        this.images = images;
        this.behindLayers = [];
        this.frontLayers = [];
        for(let image in this.images){
            const layer = new Layer({
                position: {x: 0, y: 0},
                width: this.width,
                parallaxSpeed: this.images[image].parallaxSpeed,
                grid: this.images[image].grid,
                imageSrc: this.images[image].imageSrc
            });
            if(this.images[image].grid){this.gridLayer = layer;}
            if(this.images[image].front){this.frontLayers.push(layer);}
            else{this.behindLayers.push(layer);}
        };
        this.layers = this.behindLayers.concat(this.frontLayers);

        this.objects = objects;
        this.spriteObjects = [];
        for(let object in this.objects){
            const spriteObject = new Sprite({
                position: this.objects[object].position,
                imageSrc: this.objects[object].imageSrc,
                scale: this.objects[object].scale
            });
            this.spriteObjects.push(spriteObject);
        };
    };


    // update behind layers
    updateBehind(){
        this.behindLayers.forEach((layer) => {
            if(layer.loadLayer){layer.update();}
        });

        this.spriteObjects.forEach((spriteObject) => {
            spriteObject.update();
        });
    };

    // update front layer
    updateFront(){
        this.frontLayers.forEach((layer) => {
            if(layer.loadLayer){layer.update();}
        });
    };
};