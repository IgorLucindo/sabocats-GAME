import { ctx, canvas, debugMode } from '../../core/RenderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { gameState } from '../../core/GameState.js';
import { data as gameData } from '../../core/DataLoader.js';
import { Sprite } from '../Sprite.js';
import { syncedRandom } from '../../helpers.js';

// ObjectCrate - A loot-crate UI that opens to reveal PlaceableObjects for selection
export class ObjectCrate extends Sprite {
    constructor({totalObjects}){
        super({ texture: "assets/textures/crate/box.png" });
        this.position = { x: 0, y: 0 };
        this.objectArea = {
            position: { x: 0, y: 0 },
            width: GameConfig.objectCrate.objectAreaWidth,
            height: GameConfig.objectCrate.objectAreaHeight
        };
        this.subAreas = [];

        this.totalObjects = totalObjects;
        this.allObjectIds = Object.keys(gameData.placeableObjects);
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

    reset() {
        this.chose = false;
        this.placed = false;
        this.objects = [];
    }

    update(){
        if (this.imageLoaded && !this._centered) {
            this._centerLayout();
            this._centered = true;
        }

        // Generate objects when seed is available and we haven't generated yet
        const seed = gameState.get('match.seed');
        if (seed && this.objects.length === 0 && this.subAreas.length > 0) {
            this.generateObjects();
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
        const seed = gameState.get('match.seed');
        this.objects = [];

        // Select and create objects (synced across all clients)
        for (let i = 0; i < this.totalObjects; i++) {
            const rng = syncedRandom(seed + i);
            const index = Math.floor(rng * this.allObjectIds.length);
            const objectId = this.allObjectIds[index];
            
            const object = gameServices.entityFactory.createPlaceableObject(objectId);
            object.crateIndex = i;
            object._initIdle(); // reinitialize with correct crateIndex for seeded interval
            this.objects.push(object);
        }

        // Sync network state before positioning so we skip already-claimed objects
        this.syncNetworkState();

        // Position objects in their sub-areas (synced across all clients)
        for(let i = 0; i < this.totalObjects; i++){
            const object = this.objects[i];
            if (object.chose || object.placed) { continue; }

            const area   = this.subAreas[i];
            const scaleF = Math.min(1, area.width / object.width, area.height / object.height);
            if (scaleF < 1) { object._applyCrateScale(scaleF); }

            const rangeX = area.width  - object.width;
            const rangeY = area.height - object.height;
            
            // Use seeded random for consistent object positioning across all clients
            const rngX = syncedRandom(seed + this.totalObjects + i * 2);
            const rngY = syncedRandom(seed + this.totalObjects + i * 2 + 1);
            
            object.position.x = area.position.x + (rangeX > 0 ? rngX * rangeX : rangeX / 2);
            object.position.y = area.position.y + (rangeY > 0 ? rngY * rangeY : rangeY / 2);
        }
    }

    syncNetworkState(){
        const users = gameServices.users;

        // Handle race condition: if remote players sent updates before objects were generated,
        // sync their state to the newly created visual objects
        for (let userId in users) {
            const crateIndex = users[userId].placeableObject?.crateIndex;
            if (crateIndex !== undefined && crateIndex < this.objects.length) {
                const object = this.objects[crateIndex];
                if (!object.chose && users[userId].placeableObject.chose) { object._restoreCrateScale(); }
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
