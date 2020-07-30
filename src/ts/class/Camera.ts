import { worldWidth, worldHeight, layers } from '../main.js';
import { WorldActor } from './WorldActor.js';

export class Camera {
    moved: boolean = true;
    x: number = 0;
    y: number = 0;

    scale: number = 1;

    //TODO magic numbers
    xOffset = 64;
    yOffset = 96;

    constructor() {
        this.resized();
    }

    get right() {
        return this.x + this.viewWidth;
    }

    get bottom() {
        return this.y + this.viewHeight;
    }

    get viewWidth() {
        // if (this.scale < 1) return (layers[0].cnv.width + this.xOffset) * this.scale;
        return (layers[0].cnv.width + this.xOffset) * 1 / this.scale;
    }

    get viewHeight() {
        // if (this.scale < 1) return (layers[0].cnv.height + this.yOffset) * this.scale;
        return (layers[0].cnv.height + this.yOffset) * 1 / this.scale;
    }

    //TODO magic numbers

    get hBounds() {
        return ((worldWidth * 64) - this.viewWidth + this.xOffset * 1 / this.scale) * this.scale;
    }

    get vBounds() {
        return ((worldHeight * 16) - this.viewHeight + this.yOffset * 1 / this.scale) * this.scale;
    }


    inView(obj) {
        if (this.scale < 1) {
            return ((obj.x + this.xOffset) * this.scale > this.x && obj.x * this.scale < this.x + this.viewWidth
                && (obj.y + this.yOffset) * this.scale > this.y && obj.y * this.scale < this.y + this.viewHeight);
        } else {
            return ((obj.x + this.xOffset) > this.x * 1 / this.scale && (obj.x - this.xOffset * this.scale * 2) < (this.x + this.viewWidth) * 1 / this.scale
                && (obj.y + this.yOffset) > this.y * 1 / this.scale && (obj.y - this.yOffset * this.scale) < (this.y + this.viewHeight) * 1 / this.scale);
        }
    }

    resized() {
        this.move();
    }

    get minX() {
        return this.xOffset / 2 * this.scale;
    }

    get minY() {
        return 16 * this.scale;
    }

    move(xAmt = 0, yAmt = 0) {
        this.moved = true;
        if (this.x + xAmt > this.hBounds) {
            this.x = this.hBounds;
        }
        else if (this.x + xAmt < this.minX) {
            this.x = this.minX;
        }
        else {
            this.x += xAmt;
        }

        if (this.y + yAmt > this.vBounds) {
            this.y = this.vBounds;
        }

        //TODO magic numbers
        else if (this.y + yAmt < this.minY) {
            this.y = this.minY;
        }
        else {
            this.y += yAmt;
        }
    }

    drawObjects(actors: WorldActor[]) {
        if (!actors[0] || actors[0] == undefined) return;
        // NOTE all actors passed to this function must be on the same layer
        actors[0].ctx.save();
        actors[0].ctx.translate(-this.x, -this.y);
        actors[0].ctx.scale(this.scale, this.scale);
        for (let a of actors) {
            a.draw();
        }
        actors[0].ctx.restore();
    }

    touchToWorld(coords) {
        return [(coords[0] + this.x) * this.scale, (coords[1] + this.y) * this.scale]
    }

}
