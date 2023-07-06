// box class
class Box extends Sprite{
    constructor({objectsNumber}){
        super({imageSrc: "assets/images/box/box.png", scale: .5});
        this.position = {
            x: (background.width - 1000*this.scale)/2,
            y: (background.height - 1000*this.scale)/2
        };
        this.objectsNumber = objectsNumber;
        this.objects = [];
        this.objectsCreated = false;
        this.objectsChosed = 0;
        this.objectsPlaced = 0;
        this.loadBox = true;
    };



    // update box
    update(){
        this.draw();
        c.fillStyle = "rgba(0, 255, 255, .1)";
        c.fillRect(this.position.x + 145, this.position.y + 155, 220, 190);

        this.createObjectsInBoxDependingOnPlayer();
    };



    // create objects in box depending on player number
    createObjectsInBoxDependingOnPlayer(){
        if(!this.objectsCreated && user.userNumber == 1){
            this.createObjectsInBox();
            // send created objects of player 1 to other players
            for(let i = 0; i < this.objects.length; i++){
                const object = this.objects[i];
                boxObjects[i] = {
                    idNumber: object.idNumber,
                    position: {x : object.position.x, y: object.position.y},
                    chose: false
                };
            };
            sendObjectsCreatedInBoxToServer();
            this.objectsCreated = true;
        }
        else if(!this.objectsCreated && boxObjects.length != 0){
            this.recreateObejctsInBox();
            this.objectsCreated = true;
        }
    };



    // create objects in box
    createObjectsInBox(){
        for(let i = 0; i < this.objectsNumber; i++){
            const object = createBoxObject(Math.floor(Math.random()*5));
            object.boxNumber = i;
            object.collided = true;
            while(object.collided){
                object.position.x = this.position.x + 145 + Math.floor(Math.random() * (220-object.width*playerScale));
                object.position.y = this.position.y + 155 + Math.floor(Math.random() * (190-object.height*playerScale));
                object.collided = false;
                for(let j = 0; j < i; j++){
                    const otherObject = this.objects[j];
                    if(collision({
                        object1: {
                            position: {x: object.position.x, y: object.position.y},
                            width: object.width * playerScale,
                            height: object.height * playerScale
                        },
                        object2: {
                            position: {x: otherObject.position.x, y: otherObject.position.y},
                            width: otherObject.width * playerScale,
                            height: otherObject.height * playerScale
                        }
                    })){
                        object.collided = true;
                        break;
                    }
                };
            };
            this.objects.push(object);
        };
    };



    // recreate objects created in box of player 1
    recreateObejctsInBox(){
        for(let i = 0; i < boxObjects.length; i++){
            const object = createBoxObject(boxObjects[i].idNumber);
            object.boxNumber = i;
            object.position.x = boxObjects[i].position.x;
            object.position.y = boxObjects[i].position.y;
            if(boxObjects[i].chose){
                object.selected = true;
                box.objectsChosed++;
            }
            this.objects[i] = object;
        };
        boxObjects = [];
    };
};