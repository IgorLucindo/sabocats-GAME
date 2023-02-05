// interactable area class
class InteractableArea extends Sprite{
    constructor({position, hitbox, imageSrc, scale, method}){
        super({position, imageSrc, scale});
        this.hitbox = hitbox;
        this.hitbox.position = position;
        this.method = method;
    };



    // update interactable area
    update(){
        this.draw();
        c.fillStyle = "rgba(255, 0, 255, .2)";
        c.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        if(player.loaded && collision({object1: player.hitbox, object2: this.hitbox})){
            if(!keys.e.previousPressed && keys.e.pressed){this.method();}
        }
    };
};