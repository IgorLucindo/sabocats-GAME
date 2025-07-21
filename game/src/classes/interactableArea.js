class InteractableArea extends Sprite{
    constructor({position, hitbox, texture, scale, pressable = false, func, highlightable = false}){
        super({position, texture, scale, highlightUp: true});
        this.hitbox = hitbox;
        this.hitbox.position = {x: position.x, y: position.y};
        this.func = func;
        this.pressable = pressable;
        this.highlightable = highlightable;
        this.highlighted = false;
        if(pressable && highlightable){
            this.keySprite = new Sprite({
                position: {x: this.position.x, y: this.position.y},
                texture: "assets/textures/keys/e.png",
                frameRate: 7,
                frameBuffer: 11
            });
            const keySpriteSize = 48;
            this.keySprite.position.x += (this.hitbox.width - keySpriteSize)/2;
            this.keySprite.position.y -= (keySpriteSize + 20);
        }
    };



    // update interactable area
    update(){
        // reset states
        this.resetStates();
        // player reach area and execute func if pressable or not
        if(player.loaded && collision({object1: player.hitbox, object2: this.hitbox})){
            if(this.highlightable){this.highlighted = true;}
            if((this.pressable && !keys.e.previousPressed && keys.e.pressed) || !this.pressable){this.func();}
        }
    };



    // render draw
    render(){
        ctx.save();
        if(debugMode){
            ctx.fillStyle = "rgba(255, 0, 255, .2)";
            ctx.fillRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height);
        }

        if(this.highlighted){
            this.keySprite.updateFrames();
            this.keySprite.draw();
        }
        this.renderHighlight();

        this.draw();
        ctx.restore();
    };



    // reset states
    resetStates(){
        this.highlighted = false;
    };
};