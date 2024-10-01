// box object class
class BoxObject extends Sprite{
    constructor({idNumber, position, imageSrc, width, height, hitbox, rotatable = false,
                 needSupport = false, compositeObject = {number: 0}, auxObjectId = undefined}){
        super({position, imageSrc, scale: playerScale});
        this.idNumber = idNumber;
        this.boxId = undefined;
        this.width = width;
        this.height = height;
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.main = true;

        this.chose = false;
        this.placed = false;
        this.previousPlaced = false;
        this.placeable = false;
        this.highlighted = false;

        this.rotatable = rotatable;
        this.rotation = 0;
        this.previousRotation = 0;
        this.rotationCenter = {x: 0, y: 0};

        this.needSupport = needSupport;

        this.compositeObjects = [];
        for(let i = 0; i < compositeObject.number; i++){
            const compositeObjectTemp = createBoxObject(compositeObject.id);
            compositeObjectTemp.main = false;
            this.compositeObjects.push(compositeObjectTemp);
        };

        if(auxObjectId){
            this.auxObject = createAuxObject(auxObjectId, this);
        }
    };



    // update object
    update(){
        if(this.auxObject){this.auxObject.update();}
    };

    // update object in choosing state
    updateInChoosing(){
        if(this.chose){return;}

        if(!user.boxObject.chose){
            this.mouseOver({object: this, func: () => {this.choose();}});
        }
        this.update();
    };

    // update object in placing state
    updateInPlacing(){
        if(!this.chose){return;}

        if(!this.placed && this.boxId == user.boxObject.boxId){
            this.followObject({object: mouse, func: () => {
                this.updateRotationCenter();
                this.updateCompositeObjects();
                this.checkPlaceable();
            }});
            this.rotateControl();
            this.placeControl();
        }
        this.updateRotationCenter();
        this.updateCompositeObjects();
        this.checkRotation();
        this.checkPlacement();
        if(!this.placed){this.update();}
    };



    // render object
    render(){
        ctx.save();
        if(this.auxObject){this.auxObject.render();}

        if(!this.rotation){this.draw();}
        else{this.drawRotated(this.rotation, this.rotationCenter);}
        ctx.restore();
    };

    // render object in choosing state
    renderInChoosing(){
        if(this.chose){return;}

        ctx.save();
        this.renderHighlight();
        this.render();
        ctx.restore();
    };
    
    // render object in placing state
    renderInPlacing(){
        if(!this.chose || this.placed){return;}

        this.render();
    };


    
    // update rotation center
    updateRotationCenter(){
        const translationX = Math.floor((this.width-1) / 2 / tileSize) * tileSize;
        const translationY = Math.floor((this.height-1) / 2 / tileSize) * tileSize;
        this.rotationCenter.x = this.position.x + translationX + tileSize/2;
        this.rotationCenter.y = this.position.y + translationY + tileSize/2;
    };



    // update composite objects
    updateCompositeObjects(){
        for(let i in this.compositeObjects){
            const compositeObject = this.compositeObjects[i];
            compositeObject.position.x = this.position.x + i*tileSize;
            compositeObject.position.y = this.position.y;
            compositeObject.rotation = this.rotation;
            compositeObject.rotationCenter.x = this.rotationCenter.x;
            compositeObject.rotationCenter.y = this.rotationCenter.y;
        };
    };



    // object follows mouse postion
    followObject({object, func = ()=>{}}){
        if(object.previousGridPosition.x != object.gridPosition.x ||
           object.previousGridPosition.y != object.gridPosition.y){
            const translationX = Math.floor((this.width-1)/2/tileSize)*tileSize;
            const translationY = Math.floor((this.height-1)/2/tileSize)*tileSize;
            this.position.x = grid.position.x + object.gridPosition.x*tileSize - translationX;
            this.position.y = grid.position.y + object.gridPosition.y*tileSize - translationY;
            func();
        }
    };



    // rotate control
    rotateControl(){
        if(this.rotatable && !keys.e.previousPressed && keys.e.pressed && !keys.shift.pressed){
            this.rotation += 90;
            if(this.rotation == 360){this.rotation = 0;}
            if(this.auxObject){this.auxObject.rotation = this.rotation;}

            user.boxObject.rotation = this.rotation;
            sendObjectRotationToServer();
        }
    };



    // place control
    placeControl(){
        if(this.placeable && !mouse.mouse1.previousPressed && mouse.mouse1.pressed){
            this.placed = true;
            user.boxObject.placed = true;
            user.boxObject.position.x = this.position.x;
            user.boxObject.position.y = this.position.y;
            mouse.hideCursor();
            sendPlacedObjectToServer();
        }
    };



    // choose
    choose(){
        this.chose = true;
        user.boxObject.chose = true;
        user.boxObject.boxId = this.boxId;
        sendChosedObjectToServer();
    };



    // rotate
    rotate(){
        const rotatedHitbox = rotate90deg({
            object: {
                position: {
                    x: this.position.x + this.hitbox.position.x,
                    y: this.position.y + this.hitbox.position.y
                },
                width: this.hitbox.width,
                height: this.hitbox.height
            },
            center: this.rotationCenter
        });
        this.hitbox.position.x = rotatedHitbox.position.x - this.position.x;
        this.hitbox.position.y = rotatedHitbox.position.y - this.position.y;
        this.hitbox.width = rotatedHitbox.width;
        this.hitbox.height = rotatedHitbox.height;
    };




    // place
    place(){
        match.objects.push(this);

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



    // rotate composite objects
    rotateCompositeObjects(){
        for(let i in this.compositeObjects){
            const compositeObject = this.compositeObjects[i];
            compositeObject.rotate();
        };
    };



    // place composte objects
    placeCompositeObjects(){
        for(let i in this.compositeObjects){
            const compositeObject = this.compositeObjects[i];
            compositeObject.checkPlaceable();
            if(compositeObject.placeable){compositeObject.place();}
        };
    };



    // check if object is placeable
    checkPlaceable(){
        this.placeable = true;
        // check collision
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
        // check support 
        let bottom = {
            position: {x: this.position.x + 1, y: this.position.y + this.height},
            width: this.width - 2,
            height: 0
        };
        if(this.needSupport){
            this.placeable = false;
            const numberOfRotations = this.rotation / 90;
            for(let i = 0; i < numberOfRotations; i++){
                bottom = rotate90deg({object: bottom, center: this.rotationCenter});
            };
        }
        // change placeable state
        for(let i in allCollisionBlocks){
            const collisionBlock = allCollisionBlocks[i];
            if(collisionBlock.placingPhaseCollision &&
               collision({object1: thisCollisionBlock, object2: collisionBlock})){
                this.placeable = false;
                break;
            }
            if(this.needSupport &&
               collision({object1: bottom, object2: collisionBlock})){
                this.placeable = true;
            }
        };
        if(collision({object1: thisCollisionBlock, object2: startArea}) ||
           collision({object1: thisCollisionBlock, object2: finishAreaCollision})){
            this.placeable = false;
        }
        for(let i in this.compositeObjects){
            const compositeObject = this.compositeObjects[i];
            compositeObject.checkPlaceable();
            if(compositeObject.placeable){this.placeable = true;}
        };
        // change cursor
        if(this.main){
            if(this.placeable){mouse.showCursor();}
            else{mouse.showCursor("block");}
        }
    };



    // check rotation
    checkRotation(){
        if(this.previousRotation != this.rotation){
            const numberOfRotations = ((this.rotation - this.previousRotation)/90 + 4) % 4;
            for(let i = 0; i < numberOfRotations; i++){
                this.rotateCompositeObjects();
                this.rotate();
                if(this.auxObject){this.auxObject.rotate();}
            };
            this.checkPlaceable();
        }
        this.previousRotation = this.rotation;
    };



    // check placement
    checkPlacement(){
        if(!this.previousPlaced && this.placed){
            if(this.compositeObjects.length){this.placeCompositeObjects();}
            else{this.place();}
        }
        this.previousPlaced = this.placed;
    };



    // reset states
    resetStates(){
        this.highlighted = false;
    };
};