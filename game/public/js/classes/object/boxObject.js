// box object class
class BoxObject extends Sprite{
    constructor({idNumber, position, imageSrc, width, height, hitbox, rotatable = false, auxObject = undefined}){
        super({position, imageSrc, scale: playerScale});
        this.idNumber = idNumber;
        this.boxNumber = undefined;
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.placed = false;
        this.previousPlaced = false;
        this.collided = false;
        this.rotatable = rotatable;
        this.rotation = 0;
        this.rotationCenter = {x: 0, y: 0};
        this.auxObject = auxObject;
    };



    // update object
    update(){
        c.save();
        // choose object
        if(!user.boxObject.chose){
            this.mouseOver({
                object: this,
                method: () => {
                    box.objectsChosed++;
                    user.boxObject.chose = true;
                    user.boxObject.boxNumber = this.boxNumber;
                    sendChosedObjectToServer();
                }
            });
        }
        // place object
        else if(!this.placed && placingPhase){
            this.followObject({
                object: mouse,
                method: () => {this.checkCollision();}
            });
            this.rotateControl();
            if(!mouse.mouse1.previousPressed && mouse.mouse1.pressed && !this.collided){
                this.placed = true;
                user.boxObject.placed = true;
                user.boxObject.position.x = this.position.x;
                user.boxObject.position.y = this.position.y;
                mouse.hideCursor();
                sendPlacedObjectToServer();
            }
        }

        if(this.auxObject){
            this.auxObject.update({
                mainObject: {
                    position: {x: this.position.x, y: this.position.y},
                    rotation: this.rotation
                }
            });
        }

        if(!this.rotation){this.draw();}
        else{this.drawRotated(this.rotation, this.rotationCenter);}
        c.restore();
    };



    // update choosing object
    updateChoosingObject(){
        if(this.selected){checkEndingOfChoosingPhase();}
        else{this.update();}
    };



    // update placing object
    updatePlacingObject(){
        if(this.boxNumber == user.boxObject.boxNumber){this.update();}
        if(!this.previousPlaced && this.placed){
            this.placeObject();
            checkEndingOfPlacingPhase();
        }
        this.previousPlaced = this.placed;
    };



    // object follows mouse postion
    followObject({object, method = ()=>{}}){
        if(object.previousGridPosition.x != object.gridPosition.x ||
           object.previousGridPosition.y != object.gridPosition.y){
            const translationX = Math.floor((this.width-1)/2/tileSize)*tileSize;
            const translationY = Math.floor((this.height-1)/2/tileSize)*tileSize;
            this.position.x = grid.position.x + object.gridPosition.x*tileSize - translationX;
            this.position.y = grid.position.y + object.gridPosition.y*tileSize - translationY;
            method();
        }
    };



    // place object
    placeObject(){
        box.objectsPlaced++;
        allObjects.push(this);

        const collisionObject = new CollisionBlock({
            position: {
                x: this.position.x + this.hitbox.position.x,
                y: this.position.y + this.hitbox.position.y
            },
            width: this.hitbox.width,
            height: this.hitbox.height,
            death: this.hitbox.death
        });
        allCollisionBlocks.push(collisionObject);

        if(this.auxObject){
            this.auxObject.collisionBlock = new CollisionBlock(this.auxObject.hitbox);
            allCollisionBlocks.push(this.auxObject.collisionBlock);
        }
    };



    // check collision
    checkCollision(){
        const thisCollisionBlock = {
            position: {
                x: this.position.x + this.hitbox.position.x + 1,
                y: this.position.y + this.hitbox.position.y + 1
            },
            width: this.hitbox.width - 2,
            height: this.hitbox.height - 2
        };
        const finishAreaCollision = {
            position: allInteractableAreas[0].position,
            width: allInteractableAreas[0].hitbox.width,
            height: allInteractableAreas[0].hitbox.height
        };
        
        this.collided = false;
        for(let i in allCollisionBlocks){
            const collisionBlock = allCollisionBlocks[i]
            if(collisionBlock.placingPhaseCollision &&
               collision({object1: thisCollisionBlock, object2: collisionBlock})){
                this.collided = true;
                mouse.showCursor("block");
                return;
            }
        };
        if(collision({object1: thisCollisionBlock, object2: startArea}) ||
           collision({object1: thisCollisionBlock, object2: finishAreaCollision})){
            this.collided = true;
            mouse.showCursor("block");
            return;
        }
        mouse.showCursor();
    };



    // rotate control
    rotateControl(){
        if(this.rotatable && !keys.e.previousPressed && keys.e.pressed && !keys.shift.pressed){
            const translationX = Math.floor((this.width-1)/2/tileSize)*tileSize;
            const translationY = Math.floor((this.height-1)/2/tileSize)*tileSize;
            this.rotationCenter = {x: translationX + tileSize/2, y: translationY + tileSize/2};
            this.rotate(this.rotationCenter);
            if(this.auxObject){
                this.auxObject.getRotationCenter({mainCenter: this.rotationCenter});
                this.auxObject.rotate(this.rotationCenter);
            }

            this.rotation += 90;
            if(this.rotation == 360){this.rotation = 0;}
            user.boxObject.rotation = this.rotation;
            sendObjectRotationToServer();

            this.checkCollision();
        }
    };



    // rotate
    rotate(center){
        const rotatedHitbox = rotate90deg({
            object: {
                position: {
                    x: this.position.x + this.hitbox.position.x,
                    y: this.position.y + this.hitbox.position.y
                },
                width: this.hitbox.width,
                height: this.hitbox.height
            },
            center: {
                x: this.position.x + center.x,
                y: this.position.y + center.y
            }
        });
        this.hitbox.position.x = rotatedHitbox.position.x - this.position.x;
        this.hitbox.position.y = rotatedHitbox.position.y - this.position.y;
        this.hitbox.width = rotatedHitbox.width;
        this.hitbox.height = rotatedHitbox.height;
    };
};