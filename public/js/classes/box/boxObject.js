// box object class
class BoxObject extends Sprite{
    constructor({position, tileWidth, tileHeight, imageSrc}){
        super({position, imageSrc, scale: playerScale * .5});
        this.width = TILE_SIZE * tileWidth;
        this.height = TILE_SIZE * tileHeight;
        this.placed = false;
    };



    // update object
    update(){
        c.save();
        if(!this.selected){
            this.mouseOver({
                object: this,
                method: () => {allObjects.push(this);}
            });
        }
        else if(!this.placed && !box.loadBox){
            this.dragObject();
            if(!mouse.mouse1.previousPressed && mouse.mouse1.pressed){
                this.placed = true;
                // last placed object starts round
                if(this.checkAllObjectsPlaced()){startRound();}
                const collisionObject = new CollisionBlock({
                    position: {x: this.position.x, y: this.position.y},
                    width: this.width,
                    height: this.height
                });
                allCollisionBlocks.push(collisionObject);
            }
        }
        this.draw();
        c.restore();
    };

    dragObject(){
        if(mouse.previousGridPosition.x != mouse.gridPosition.x ||
           mouse.previousGridPosition.y != mouse.gridPosition.y){
            this.position.x = grid.position.x + mouse.gridPosition.x*TILE_SIZE;
            this.position.y = grid.position.y + mouse.gridPosition.y*TILE_SIZE;
        }
    };

    // check if all objects are placed
    checkAllObjectsPlaced(){
        if(allObjects.length == 0){return false;}
        for(let object in allObjects){
            if(!allObjects[object].placed){return false;}
        };
        return true;
    };
};