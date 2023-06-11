// interactable area class
class InteractableArea extends Sprite{
    constructor({position, hitbox, imageSrc, scale, pressable, method}){
        super({position, imageSrc, scale});
        this.hitbox = hitbox;
        this.hitbox.position = position;
        this.pressable = pressable;
        this.method = method;
    };



    // update interactable area
    update(){
        this.draw();
        c.fillStyle = "rgba(255, 0, 255, .2)";
        c.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        // player reach area and execute method() if pressable or not
        if(player.loaded &&
        collision({object1: player.hitbox, object2: this.hitbox}) &&
        ((this.pressable && !keys.e.previousPressed && keys.e.pressed) || !this.pressable)){
            this.method();
        }
    };
};