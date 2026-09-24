import { ctx } from '../core/RenderContext.js';
import { gameServices } from '../core/GameServices.js';
import { getCursorColor } from '../helpers.js';

export class ProximityIndicatorSystem {
    constructor() {
        this._ticks = 0;
        this._hasNearbyRemotePlayer = false;
        this._opacity = 0;
        
        // Cache variables
        this._path = null;
        this._color = null;
    }

    // Update indicator logic and calculate opacity easing
    update(player) {
        if (!player.loaded || player.dead || player.finished) {
            this._hasNearbyRemotePlayer = false;
            this._ticks = 0;
        } else {
            this._ticks++;
            if (this._ticks % 120 === 0) {
                this._hasNearbyRemotePlayer = this._isRemotePlayerNearby(player);
            }
        }

        const targetOpacity = this._hasNearbyRemotePlayer ? 1 : 0;
        this._opacity += (targetOpacity - this._opacity) * 0.1;
    }

    // Render the precomputed upside-down house indicator
    render(player) {
        if (this._opacity < 0.01) { return; }

        if (!this._path) {
            this._precompute(player);
        }

        const centerX = player.hitbox.position.x + player.hitbox.width / 2;
        const offsetY = (1 - this._opacity) * -10;
        const bottomY = player.hitbox.position.y - 32 + offsetY;

        ctx.save();
        ctx.globalAlpha = this._opacity;
        ctx.shadowColor = this._color;
        ctx.shadowBlur = 12 * this._opacity; 

        // Shift canvas origin to the player's dynamic position
        ctx.translate(centerX, bottomY);

        ctx.fillStyle = this._color;
        ctx.fill(this._path);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.5;
        ctx.stroke(this._path);

        ctx.restore();
    }

    // Cache the color and Path2D geometry relative to (0,0)
    _precompute(player) {
        this._color = getCursorColor(gameServices.user.loginOrder);
        
        const w = player.hitbox.width * 0.18; 
        const squareH = w * 0.8;
        const triH = w * 0.7;
        const totalH = squareH + triH;

        this._path = new Path2D();
        this._path.moveTo(-w / 2, -totalH);
        this._path.lineTo(w / 2, -totalH);
        this._path.lineTo(w / 2, -triH);
        this._path.lineTo(0, 1);
        this._path.lineTo(-w / 2, -triH);
        this._path.closePath();
    }

    // Check if any remote player is within the indicator distance
    _isRemotePlayerNearby(player) {
        const indicatorDistance = gameServices.gameConfig.player.indicatorDistance * player.scale;
        
        for (const user of Object.values(gameServices.users)) {
            if (user.id === gameServices.user.id) { continue; }
            const remotePlayer = user.remotePlayer;
            if (!remotePlayer?.loaded || remotePlayer.dead || remotePlayer.finished) { continue; }

            const distanceX = Math.abs(remotePlayer.position.x - player.position.x);
            const distanceY = Math.abs(remotePlayer.position.y - player.position.y);
            
            if (distanceX <= indicatorDistance && distanceY <= indicatorDistance) { 
                return true; 
            }
        }
        return false;
    }
}