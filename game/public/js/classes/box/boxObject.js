// box object class
class BoxObject extends Sprite{
    constructor({idNumber, position, width, height, hitbox, deathHitbox = null, imageSrc}){
        super({position, imageSrc, scale: playerScale});
        this.idNumber = idNumber;
        this.boxNumber = undefined;
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.deathHitbox = deathHitbox;
        this.placed = false;
        this.previousPlaced = false;
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
            this.followObject({object: mouse});
            if(!mouse.mouse1.previousPressed && mouse.mouse1.pressed){
                this.placed = true;
                user.boxObject.placed = true;
                user.boxObject.position.x = this.position.x;
                user.boxObject.position.y = this.position.y;
                hideCursor();
                sendPlacedObjectToServer();
            }
        }
        this.draw();
        c.restore();
    };



    // update choosing object
    updateChoosingObject(){
        if(choosingPhase){
            if(this.selected){checkEndingOfChoosingPhase();}
            else{this.update();}
        }
    };



    // update placing object
    updatePlacingObject(){
        if(placingPhase){
            if(this.boxNumber == user.boxObject.boxNumber){this.update();}
            if(!this.previousPlaced && this.placed){
                this.placeObject();
                checkEndingOfPlacingPhase();
            }
        }
        this.previousPlaced = this.placed;
    };



    // object follows mouse postion
    followObject({object}){
        if(object.previousGridPosition.x != object.gridPosition.x ||
            object.previousGridPosition.y != object.gridPosition.y){
            this.position.x = grid.position.x + object.gridPosition.x*TILE_SIZE;
            this.position.y = grid.position.y + object.gridPosition.y*TILE_SIZE;
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
            height: this.hitbox.height
        });
        allCollisionBlocks.push(collisionObject);
        if(this.deathHitbox){
            const deathBlock = new DeathBlock({
                position: {
                    x: this.position.x + this.deathHitbox.position.x,
                    y: this.position.y + this.deathHitbox.position.y
                },
                width: this.deathHitbox.width,
                height: this.deathHitbox.height
            });
            allDeathBlocks.push(deathBlock);
        }
    };
};