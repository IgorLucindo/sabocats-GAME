// collisionBlock class
class AuxObject extends Sprite{
    constructor({position, imageSrc, hitbox, getMovement = ()=>{}}){
        super({position, imageSrc, scale: playerScale});
        this.position = position;
        this.mainObjectPosition = {x: 0, y: 0};
        this.hitbox = hitbox;
        this.collisionBlock = undefined;
        this.getMovement = getMovement;
        this.movement = {x: 0, y: 0};
    };



    // update auxilliary object
    update({mainObjectPosition}){
        this.mainObjectPosition.x = mainObjectPosition.x;
        this.mainObjectPosition.y = mainObjectPosition.y;
        this.movement = this.getMovement(this.elapsedFrames);

        this.updatePosition();
        this.updateHitbox();

        if(playingPhase){this.updateFrames();}
        this.draw();
    };



    // update position
    updatePosition(){
        this.position.x = this.mainObjectPosition.x-10;
        this.position.y = this.mainObjectPosition.y-10;
        this.position.x += this.movement.x;
        this.position.y += this.movement.y;
    };



    // update hitbox
    updateHitbox(){
        this.hitbox.position.x = this.mainObjectPosition.x-10;
        this.hitbox.position.y = this.mainObjectPosition.y-10;
        this.hitbox.position.x += this.movement.x;
        this.hitbox.position.y += this.movement.y;
    };
};