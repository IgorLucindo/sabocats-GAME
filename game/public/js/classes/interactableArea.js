// interactable area class
class InteractableArea extends Sprite{
    constructor({position, hitbox, imageSrc, scale, playerScale, pressable = false, method, highlightable = false}){
        super({position, imageSrc, scale, highlightUp: true});
        this.hitbox = hitbox;
        this.hitbox.position = {x: position.x, y: position.y};
        this.method = method;
        this.pressable = pressable;
        this.highlightable = highlightable;
        if(pressable && highlightable){
            this.keySprite = new Sprite({
                position: {x: this.position.x, y: this.position.y},
                imageSrc: "assets/images/keys/e.png",
                frameRate: 7,
                frameBuffer: 11,
                scale: playerScale
            });
            const keySpriteSize = 48 * playerScale;
            this.keySprite.position.x += (this.hitbox.width - keySpriteSize)/2;
            this.keySprite.position.y -= (keySpriteSize + 15);
        }
    };



    // update interactable area
    update(){
        c.save();
        c.fillStyle = "rgba(255, 0, 255, .2)";
        c.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        // player reach area and execute method() if pressable or not
        if(player.loaded && collision({object1: player.hitbox, object2: this.hitbox})){
            if(this.highlightable){
                this.highlightSprite();
                this.keySprite.updateFrames();
                this.keySprite.update();
            }
            if((this.pressable && !keys.e.previousPressed && keys.e.pressed) || !this.pressable){this.method();}
        }
        this.draw();
        c.restore();
    };
};