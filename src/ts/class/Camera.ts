import { viewScale, cnv, worldWidth, worldHeight } from '../main.js';

export class Camera {
    x: number = 0;
    y: number = 0;
    viewWidth: number;
    viewHeight: number;

    hBounds: number;
    vBounds: number;

    xOffset = 32 * viewScale;
    yOffset = 48 * viewScale;

    constructor() {
        this.resized();
    }

    resized() {
        this.viewWidth = cnv.width + this.xOffset;
        this.viewHeight = cnv.height + this.yOffset;

        this.hBounds = (worldWidth * 32 * viewScale) - this.viewWidth + this.xOffset;
        this.vBounds = (worldHeight * 8 * viewScale) - this.viewHeight + this.yOffset;

        this.move();
    }

    move(xAmt = 0, yAmt = 0) {
        if (this.x + xAmt > this.hBounds) {
            this.x = this.hBounds;
        }
        else if (this.x + xAmt < this.xOffset / 2) {
            this.x = this.xOffset / 2;
        }
        else {
            this.x += xAmt;
        }

        if (this.y + yAmt > this.vBounds) {
            this.y = this.vBounds;
        }
        else if (this.y + yAmt < 8 * viewScale) {
            this.y = 8 * viewScale;
        }
        else {
            this.y += yAmt;
        }
    }

}
