import { ctx, debugMode } from '../../core/renderContext.js';
import { GameConfig, data } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { Sprite } from '../Sprite.js';

export class CharacterOption extends Sprite {
    constructor({ id, position, texture, frameRate, frameBuffer, idNumber }) {
        super({ texture, frameRate, frameBuffer, scale: GameConfig.rendering.pixelScale });
        this.id = id;
        this.position = position;
        this.initialPosition = { x: this.position.x, y: this.position.y };
        this.selectableBox = {
            position: {
                x: this.position.x + 30 * this.scale,
                y: this.position.y + 12 * this.scale
            },
            width: 70 * this.scale,
            height: 66 * this.scale
        };
        this.idNumber = idNumber;
        this.highlighted = false;
    };



    // update
    update() {
        this.resetStates();

        this.mouseOver({
            object: this.selectableBox,
            func: () => {
                gameServices.inputSystem.removeMouseListeners();
                gameServices.cursorSystem.hideCursor();
                const user = gameServices.user;
                user.onlinePlayer.id = this.id;
                user.onlineSelectablePlayer.id = this.idNumber;
                gameServices.player.loadCharacter(this.id, data.characters[this.id], this);
                gameServices.socketHandler.sendUpdatePlayer();
            }
        });
    };



    // render
    render() {
        ctx.save();

        this.renderHighlight();

        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 0, .1)";
            ctx.fillRect(this.selectableBox.position.x, this.selectableBox.position.y, this.selectableBox.width, this.selectableBox.height);
        }

        this.updateFrames();
        this.draw();
        ctx.restore();
    };



    // reset states
    resetStates() {
        this.highlighted = false;
    };
};
