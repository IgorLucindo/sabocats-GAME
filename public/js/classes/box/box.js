// box class
class Box extends Sprite{
    constructor({objectsNumber}){
        super({imageSrc: "../assets/images/objectBox/objectBox.png", scale: .5});
        this.position = {
            x: scaledCanvas.width/2 - 500*this.scale - camera.position.x,
            y: scaledCanvas.height/2 - 500*this.scale - camera.position.y
        };

        this.objects = [];
        for(let i = 0; i < objectsNumber; i++){
            const object = createBoxObject(0);
            let collided = true;
            while(collided){
                object.position.x = this.position.x + 145 + Math.floor(Math.random() * (220-object.width));
                object.position.y = this.position.y + 155 + Math.floor(Math.random() * (190-object.height));
                collided = false;
                for(let j = 0; j < i; j++){
                    if(collision({object1: object, object2: this.objects[j]})){
                        collided = true;
                        break;
                    }
                };
            };
            this.objects.push(object);
        };
        this.loadBox = true;
        this.objectsSelectedNumber = 0;
    };



    // update box
    update(){
        this.draw();
        c.fillStyle = "rgba(0, 255, 255, .1)";
        c.fillRect(this.position.x + 145, this.position.y + 155, 220, 190);

        this.objectsSelectedNumber = 0;
        this.objects.forEach((object) => {
            object.update();
            if(object.selected){
                this.objectsSelectedNumber++;
                const numberOfPlayers = Object.keys(users).length;
                if(this.objectsSelectedNumber == numberOfPlayers){this.loadBox = false;}
            }
        });
    };
};