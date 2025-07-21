// box class
class Box extends Sprite{
    constructor({totalObjects}){
        super({texture: "assets/textures/box/box.png", scale: 1});
        this.position = {
            x: (background.width - 1000*this.scale)/2,
            y: (background.height - 1000*this.scale)/2
        };
        this.objectArea = {
            position: {x: this.position.x + 290, y: this.position.y + 310},
            width: 440,
            height: 380
        };
        this.subAreas = this.divideAreaGrid(this.objectArea, totalObjects);

        this.totalObjects = totalObjects;
        this.canOpen = false;
        this.seed = [];
        this.objects = [];
    };



    // update
    update(){
        // generate objects
        if(this.canOpen){
            this.open();
            this.canOpen = false;
        }
    };



    // render
    render(){
        this.draw();
        if(debugMode){
            for(let i = 0; i < this.subAreas.length; i++){
                const subArea = this.subAreas[i];
                ctx.fillStyle = "rgba(0, " + (255*i/this.subAreas.length) + ", 255, .1)";
                ctx.fillRect(subArea.position.x, subArea.position.y,  subArea.width,  subArea.height);
            };
        }
    };



    // open box
    open(){
        this.generateObjects();
    };



    // generate objects in box
    generateObjects(){
        this.objects = [];
        
        for(let i = 0; i < this.totalObjects; i++){
            // create object
            const objectId = this.seed[i];
            const object = createBoxObject(objectId);
            object.boxId = i;
            object.position.x = this.subAreas[i].position.x;
            object.position.y = this.subAreas[i].position.y;

            // push to object list
            this.objects.push(object);
        };
    };
    


    // separate object area in totalObjects areas
    divideAreaGrid(area, n){
        // calculate number of rows
        const rows = Math.floor(Math.sqrt(n));
        // calculate number of columns
        const cols = Math.ceil(n / rows);
      
        const subAreaWidth = Math.floor(area.width / cols);
        const subAreaHeight = Math.floor(area.height / rows);
      
        const subAreas = [];
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const x = j * subAreaWidth;
            const y = i * subAreaHeight;
            const subArea = {
              position: {x: area.position.x + x, y: area.position.y + y},
              width: Math.min(subAreaWidth, area.width - x), // handle edge cases
              height: Math.min(subAreaHeight, area.height - y)
            };
            subAreas.push(subArea);
      
            if (subAreas.length === n) {
              return subAreas;
            }
          }
        }
      
        throw new Error("Cannot divide area into exact number of sub-areas with this grid layout");
      };
};