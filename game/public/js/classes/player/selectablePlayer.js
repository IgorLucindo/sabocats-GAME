// selectable player class
class SelectablePlayer extends Sprite{
    constructor({id, position, imageSrc, frameRate, frameBuffer, scale = 1, idNumber}){
        super({imageSrc, frameRate, frameBuffer, scale});
        this.id = id;
        this.position = position;
        this.inicialPosition = {x: this.position.x, y: this.position.y};
        this.selectableBox = {
            position: {
                x: this.position.x + 30*this.scale,
                y: this.position.y + 12*this.scale
            },
            width: 70 * this.scale,
            height: 66 * this.scale
        };
        this.idNumber = idNumber;
    };



    // update function
    update(){
        c.save();
        this.updateFrames();
        c.fillStyle = "rgba(255, 0, 0, .1)";
        c.fillRect(this.selectableBox.position.x, this.selectableBox.position.y, this.selectableBox.width, this.selectableBox.height);

        this.mouseOver({
            object: this.selectableBox,
            method: () => {
                removeMouseEvents();
                hideCursor();
                player = createPlayer({
                    id: this.id,
                    position: this.position,
                    scale: this.scale,
                    selectablePlayer: this
                });
                player.loaded = true;
                sendSelectedPlayerToServer(this.id, this.idNumber);
            }
        });

        this.draw();
        c.restore();
    };
};