import { viewScale, worldWidth, worldHeight, layers } from '../main.js';

export class Camera {
    x: number = 0;
    y: number = 0;
    viewWidth: number;
    viewHeight: number;

    hBounds: number;
    vBounds: number;

    //TODO magic numbers
    xOffset = 64 * viewScale;
    yOffset = 96 * viewScale;

    constructor() {
        this.resized();
    }

    resized() {
        this.viewWidth = layers[0].cnv.width + this.xOffset;
        this.viewHeight = layers[0].cnv.height + this.yOffset;

        //TODO magic numbers
        this.hBounds = (worldWidth * 64 * viewScale) - this.viewWidth + this.xOffset;
        this.vBounds = (worldHeight * 16 * viewScale) - this.viewHeight + this.yOffset;

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

        //TODO magic numbers
        else if (this.y + yAmt < 16 * viewScale) {
            this.y = 16 * viewScale;
        }
        else {
            this.y += yAmt;
        }
    }

}
