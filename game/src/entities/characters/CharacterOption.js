import { ctx, debugMode } from '../../core/renderContext.js';
import { data } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { Sprite } from '../Sprite.js';

export class CharacterOption extends Sprite {
    constructor({ id, position, texture, frameRate, frameBuffer, idNumber, hoverSound }) {
        super({ texture, frameRate, frameBuffer });
        this.id = id;
        this.position = position;
        this.initialPosition = { x: this.position.x, y: this.position.y };
        this.selectableBox = {
            position: {
                x: this.position.x + 17 * this.scale,
                y: this.position.y + 19 * this.scale
            },
            width: 30 * this.scale,
            height: 30 * this.scale
        };
        this.idNumber = idNumber;
        this.hoverSound = hoverSound;
        this.highlighted = false;
    };



    // update
    update() {
        this.resetStates();
        this.updateFrames();

        if (gameServices.player.loaded) {
            this._wasHighlighted = false;
            return;
        }

        this.mouseOver({
            object: this.selectableBox,
            func: () => {
                gameServices.cursorSystem.hideCursor();
                gameServices.soundSystem.play('select');
                const user = gameServices.user;
                user.localPlayer.id = this.id;
                user.characterOption.id = this.idNumber;
                gameServices.player.loadCharacter(this.id, data.characters[this.id], this);
                gameServices.socketHandler.sendUpdatePlayer();

                const { autoVote, autoVoteMap } = gameServices.gameConfig.debug;
                if (autoVote) {
                    user.chooseMap.current = autoVoteMap;
                    user.chooseMap.previous = undefined;
                    gameServices.mapSystem.vote(user.chooseMap);
                    gameServices.socketHandler.sendChooseMap();
                }
            }
        });

        if (this.highlighted && !this._wasHighlighted) {
            gameServices.soundSystem.play(this.hoverSound);
        }
        this._wasHighlighted = this.highlighted;
    };



    // render
    render() {
        ctx.save();

        this.renderHighlight();

        if (debugMode) {
            ctx.fillStyle = "rgba(255, 0, 0, .1)";
            ctx.fillRect(this.selectableBox.position.x, this.selectableBox.position.y, this.selectableBox.width, this.selectableBox.height);
        }

        this.draw();
        ctx.restore();
    };



    // reset states
    resetStates() {
        this.highlighted = false;
    };
};
