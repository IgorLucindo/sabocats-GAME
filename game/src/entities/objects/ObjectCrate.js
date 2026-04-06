import { ctx, canvas, debugMode } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { Sprite } from '../Sprite.js';

// ObjectCrate - A loot-crate UI that opens to reveal PlaceableObjects for selection
export class ObjectCrate extends Sprite {
    constructor({totalObjects, seed = []}){
        super({ texture: "assets/textures/crate/box.png" });
        this.position = { x: 0, y: 0 };
        this.objectArea = {
            position: { x: 0, y: 0 },
            width: GameConfig.objectCrate.objectAreaWidth,
            height: GameConfig.objectCrate.objectAreaHeight
        };
        this.subAreas = [];

        this.totalObjects = totalObjects;
        this.canOpen = false;
        this.seed = seed;
        this.objects = [];
        this._centered = false;
    }

    _centerLayout() {
        this.position.x = Math.round((canvas.width  - this.width)  / 2);
        this.position.y = Math.round((canvas.height - this.height) / 2);
        this.objectArea.position.x = this.position.x + GameConfig.objectCrate.objectAreaOffsetX;
        this.objectArea.position.y = this.position.y + GameConfig.objectCrate.objectAreaOffsetY;
        this.subAreas = this.divideAreaGrid(this.objectArea, this.totalObjects);
    }

    update(){
        if (this.imageLoaded && !this._centered) {
            this._centerLayout();
            this._centered = true;
        }

        if(this.canOpen){
            this.generateObjects();
            this.canOpen = false;
        }
    }

    render(){
        this.draw();
        if(debugMode){
            for(let i = 0; i < this.subAreas.length; i++){
                const subArea = this.subAreas[i];
                ctx.fillStyle = "rgba(0, " + (255*i/this.subAreas.length) + ", 255, .1)";
                ctx.fillRect(subArea.position.x, subArea.position.y, subArea.width, subArea.height);
            }
        }
    }

    generateObjects(){
        this.objects = [];
        
        for(let i = 0; i < this.totalObjects; i++){
            const objectId = this.seed[i];
            const object = gameServices.entityFactory.createPlaceableObject(objectId);
            object.crateIndex = i;
            object.position.x = this.subAreas[i].position.x;
            object.position.y = this.subAreas[i].position.y;

            this.objects.push(object);
        }

        // Sync network state after objects are created
        this.syncNetworkState();
    }

    syncNetworkState(){
        const users = gameServices.users;

        // Handle race condition: if remote players sent updates before objects were generated,
        // sync their state to the newly created visual objects
        for (let userId in users) {
            const crateIndex = users[userId].placeableObject?.crateIndex;
            if (crateIndex !== undefined && crateIndex < this.objects.length) {
                const object = this.objects[crateIndex];
                object.chose = users[userId].placeableObject.chose;
                object.placed = users[userId].placeableObject.placed;
                object.position = users[userId].placeableObject.position;
                object.rotation = users[userId].placeableObject.rotation || 0;

                if (users[userId].placeableObject.placed) {
                    object.previousPlaced = false;
                    object.updateRotationCenter();
                    object.updateCompositeObjects();
                    object.checkRotation();
                    object.checkPlacement();
                }

                if (object.attachment) {
                    object.attachment.rotation = users[userId].placeableObject.rotation || 0;
                }
            }
        }
    }

    divideAreaGrid(area, n){
        const rows = Math.floor(Math.sqrt(n));
        const cols = Math.ceil(n / rows);

        const subAreaWidth  = Math.floor(area.width  / cols);
        const subAreaHeight = Math.floor(area.height / rows);

        const subAreas = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = j * subAreaWidth;
                const y = i * subAreaHeight;
                subAreas.push({
                    position: {x: area.position.x + x, y: area.position.y + y},
                    width:  Math.min(subAreaWidth,  area.width  - x),
                    height: Math.min(subAreaHeight, area.height - y)
                });

                if (subAreas.length === n) { return subAreas; }
            }
        }

        throw new Error("Cannot divide area into exact number of sub-areas with this grid layout");
    }
}
