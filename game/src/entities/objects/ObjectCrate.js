import { ctx, debugMode } from '../../core/renderContext.js';
import { GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { Sprite } from '../Sprite.js';

// ObjectCrate - A loot-crate UI that opens to reveal PlaceableObjects for selection
export class ObjectCrate extends Sprite {
    constructor({totalObjects, background}){
        super({texture: "assets/textures/box/box.png", scale: GameConfig.box.scale});
        const crateWidth = GameConfig.box.width * this.scale;
        this.position = {
            x: (background.width  - crateWidth) / 2,
            y: (background.height - crateWidth) / 2
        };
        this.objectArea = {
            position: {x: this.position.x + GameConfig.box.objectAreaOffsetX, y: this.position.y + GameConfig.box.objectAreaOffsetY},
            width: GameConfig.box.objectAreaWidth,
            height: GameConfig.box.objectAreaHeight
        };
        this.subAreas = this.divideAreaGrid(this.objectArea, totalObjects);

        this.totalObjects = totalObjects;
        this.canOpen = false;
        this.seed = [];
        this.objects = [];
    }

    update(){
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
            object.boxId = i;
            object.position.x = this.subAreas[i].position.x;
            object.position.y = this.subAreas[i].position.y;
            this.objects.push(object);
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
