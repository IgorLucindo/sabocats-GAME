import { ctx, showHitboxes } from '../../core/RenderContext.js';
import { data, GameConfig } from '../../core/DataLoader.js';
import { gameServices } from '../../core/GameServices.js';
import { lerp } from '../../helpers.js';
import { AnimatedSprite } from '../AnimatedSprite.js';

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t)  { return t * t * t; }

export class CharacterOption extends AnimatedSprite {
    constructor({ id, position, idleKey, hoverKey, idNumber, hoverSound }) {
        const charData = data.characters[id];
        const idleAnim = charData.animations[idleKey];
        super({ texture: idleAnim.texture, frameRate: idleAnim.frameRate, frameBuffer: idleAnim.frameBuffer, highlightStyle: 'glowUp' });
        this.id = id;
        this.position = position;
        this.initialPosition = { x: this.position.x, y: this.position.y };
        this._cfg = GameConfig.characterOption;
        this.selectableBox = {
            position: {
                x: this.position.x + this._cfg.selectableBox.offsetX * this.scale,
                y: this.position.y + this._cfg.selectableBox.offsetY * this.scale
            },
            width: this._cfg.selectableBox.width  * this.scale,
            height: this._cfg.selectableBox.height * this.scale
        };
        this.idNumber = idNumber;
        this.hoverSound = hoverSound;
        this._idleKey  = idleKey;
        this._hoverKey = hoverKey;
        this.highlighted = false;

        this._loadAnimations(charData.animations, idleKey);
        this._charName = charData.name;

        this._namePhase        = 'hidden'; // 'hidden' | 'in' | 'overshoot' | 'visible' | 'out'
        this._nameFrame        = 0;
        this._namePeakFired    = false;
        this._namePlateTimer   = 0;
    };



    // update
    update() {
        this.resetStates();
        this.updateFrames();

        if (gameServices.player.loaded) {
            this._wasHighlighted = false;
            return;
        }

        const cam = gameServices.cameraSystem;

        this.mouseOver({
            object: this.selectableBox,
            func: () => this._choose()
        });

        if (this.highlighted && !this._wasHighlighted) {
            gameServices.soundSystem.play(this.hoverSound);
            this.switchSprite(this._hoverKey);
            this._namePlateTimer     = this._cfg.namePlate.delayFrames;
            this._namePhase          = 'hidden';
            this._namePeakFired      = false;
            this._preHoverZoom       = cam.endZoom;
            this._preHoverWorldCenter = cam.getWorldCenter();
            cam.zoomToCursor(this._cfg.hoverZoom, gameServices.cursorSystem);
        }

        if (!this.highlighted && this._wasHighlighted) {
            this.switchSprite(this._idleKey);
            this._namePlateTimer = 0;
            if (this._namePhase !== 'hidden') {
                this._namePhase = 'out';
                this._nameFrame = 0;
            }
            this._restoreCamera();
        }

        this._tickNameAnim();
        this._wasHighlighted = this.highlighted;
    };



    // render
    render() {
        ctx.save();

        this.renderHighlight();

        if (showHitboxes) {
            ctx.fillStyle = "rgba(255, 0, 0, .1)";
            ctx.fillRect(this.selectableBox.position.x, this.selectableBox.position.y, this.selectableBox.width, this.selectableBox.height);
        }

        this.draw();
        ctx.restore();

        this._renderNamePlate();
    };



    // reset states
    resetStates() {
        this.highlighted = false;
    };



    // ── Interaction handlers ──────────────────────────────────────────────────

    _choose() {
        gameServices.cursorSystem.hideCursor();
        gameServices.soundSystem.play('select');
        const user = gameServices.user;
        user.localPlayer.id = this.id;
        user.characterOption.id = this.idNumber;
        gameServices.player.loadCharacter(this.id, data.characters[this.id], this);
        gameServices.socketHandler.sendUpdatePlayer();
        gameServices.cameraSystem.setZoom(this._preHoverZoom);

        const { autoVote, autoVoteMap } = gameServices.gameConfig.debug;
        if (autoVote) {
            user.chooseMap.current = autoVoteMap;
            user.chooseMap.previous = undefined;
            gameServices.mapSystem.vote(user.chooseMap);
            gameServices.socketHandler.sendChooseMap();
        }
    };

    _restoreCamera() {
        if (this._preHoverWorldCenter) {
            gameServices.cameraSystem.zoomToWorldCenter({
                zoom: this._preHoverZoom ?? 1,
                ...this._preHoverWorldCenter
            });
        }
    };



    // ── Name plate animation ──────────────────────────────────────────────────

    _tickNameAnim() {
        if (this._namePlateTimer > 0) {
            this._namePlateTimer--;
            if (this._namePlateTimer === 0 && this.highlighted) {
                this._namePhase = 'in';
                this._nameFrame = 0;
            }
            return;
        }

        if (this._namePhase === 'hidden' || this._namePhase === 'visible') { return; }
        this._nameFrame++;

        if (this._namePhase === 'in') {
            if (this._nameFrame >= this._cfg.namePlate.inFrames) {
                this._namePhase = 'overshoot';
                this._nameFrame = 0;
            }

        } else if (this._namePhase === 'overshoot') {
            if (!this._namePeakFired && this._nameFrame === 2) {
                this._namePeakFired = true;
                gameServices.soundSystem.play('place');
                gameServices.cameraSystem.shake(8, 1);
            }
            if (this._nameFrame >= this._cfg.namePlate.overshootFrames) {
                this._namePhase = 'visible';
            }

        } else if (this._namePhase === 'out') {
            if (this._nameFrame >= this._cfg.namePlate.outFrames) {
                this._namePhase = 'hidden';
            }
        }
    };

    _renderNamePlate() {
        if (this._namePhase === 'hidden' || !this.imageLoaded) { return; }

        const s        = this.scale;
        const pad      = Math.round(2.5 * s);
        const fontSize = Math.round(3.5 * s);
        const border   = Math.round(s);

        ctx.save();
        ctx.font          = `${fontSize}px 'Press Start 2P', monospace`;
        ctx.letterSpacing = `${Math.round(s * 0.3)}px`;
        const textW  = Math.round(ctx.measureText(this._charName).width);
        const plateW = textW + pad * 2;
        const plateH = fontSize + pad * 2;

        // Start: character centre (plate spawns here, standing vertical)
        const startX = this.selectableBox.position.x + this.selectableBox.width  / 2;
        const startY = this.selectableBox.position.y + this.selectableBox.height / 2;

        // End: top-right of the selectable box
        const endX = this.selectableBox.position.x + this.selectableBox.width  + plateW / 2 - 7 * s;
        const endY = this.selectableBox.position.y + plateH / 2 - 5 * s;

        let cx, cy, rotation, plateScale, alpha;

        if (this._namePhase === 'in') {
            const t    = easeOutCubic(Math.min(this._nameFrame / this._cfg.namePlate.inFrames, 1));
            cx         = lerp(startX, endX, t);
            cy         = lerp(startY, endY, t);
            rotation   = (1 - t) * Math.PI / 2;
            plateScale = lerp(0.4, 1.0, t);
            alpha      = t;

        } else if (this._namePhase === 'overshoot') {
            const tOver = this._nameFrame / this._cfg.namePlate.overshootFrames;
            cx          = endX;
            cy          = endY;
            rotation    = 0;
            plateScale  = 1 + 0.15 * Math.sin(tOver * Math.PI);
            alpha       = 1;

        } else if (this._namePhase === 'visible') {
            cx = endX; cy = endY; rotation = 0; plateScale = 1; alpha = 1;

        } else { // 'out'
            const t    = easeInCubic(Math.min(this._nameFrame / this._cfg.namePlate.outFrames, 1));
            cx         = lerp(endX, startX, t);
            cy         = lerp(endY, startY, t);
            rotation   = t * Math.PI / 2;
            plateScale = 1 - t;
            alpha      = 1 - t;
        }

        ctx.globalAlpha = alpha;
        ctx.translate(Math.round(cx), Math.round(cy));
        ctx.rotate(rotation);
        ctx.scale(plateScale, plateScale);

        // Border
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-plateW / 2 - border, -plateH / 2 - border, plateW + border * 2, plateH + border * 2);

        // Background — flat dark indigo
        ctx.fillStyle = 'rgba(14, 12, 32, 0.97)';
        ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);

        // Left accent bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(-plateW / 2 - border, -plateH * 0.5, border, plateH);

        // Text
        ctx.fillStyle    = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this._charName, 0, 0);

        ctx.restore();
    };
};
