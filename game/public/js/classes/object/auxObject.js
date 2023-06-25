// collisionBlock class
class AuxObject extends Sprite{
    constructor({position, imageSrc, hitbox}){
        super({position, imageSrc, scale: playerScale});
        this.position = position;
        this.mainObjectPosition = {x: 0, y: 0};
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
    };



    // update auxilliary object
    update(){
        this.updatePosition();
        this.updateHitbox();
        this.draw();
    };



    // update position
    updatePosition(){
        this.position.x = this.mainObjectPosition.x-10;
        this.position.y = this.mainObjectPosition.y-10;
    };



    // update hitbox
    updateHitbox(){
        this.hitbox.position.x = this.mainObjectPosition.x-10;
        this.hitbox.position.y = this.mainObjectPosition.y-10;
    };
};