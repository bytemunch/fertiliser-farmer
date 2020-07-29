import { Sprite } from './Sprite.js';
import { IActorOptions, viewScale, DEBUG, camera, layers } from '../main.js';
export abstract class WorldActor {
    _x: number | false;
    _y: number | false;

    gridX: number;
    gridY: number;

    sprite: Sprite;

    layer: number;

    width: number;
    height: number;

    type;

    visible: boolean = false;

    constructor(opts?: IActorOptions) {
        this._x = false;
        this._y = false;

        // console.log(fromJSON);

        this.gridX = opts.gridPosition.gridX;
        this.gridY = opts.gridPosition.gridY;

        this.type = opts.type;

        this.sprite = opts.sprite;
    }

    get img() {
        try {
            return this.sprite.cnv;
        } catch (e) {
            console.log(this.type);
            console.error(e);
        }
    }

    get xOffset(): number {
        return this.gridY % 2 ? 0 : this.width / 2;
    }

    get yOffset(): number {
        return 0;
    }

    //TODO magic numbers

    get x() {
        if (this._x === false) {
            this._x = (this.gridX * 64 + this.xOffset);
        }
        return this._x;
    }

    get y() {
        if (this._y === false) {
            this._y = (this.gridY * 16 + this.yOffset);
        }
        return this._y;
    }

    draw() {
        if (this.visible) {
            try {
            layers[this.layer].ctx.drawImage(this.img, Math.floor(this.x - camera.x), Math.floor(this.y - camera.y));
            } catch(e) {
                console.info(this.layer);
            }
            if (DEBUG.boundingBoxes) layers[this.layer].ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.width * viewScale, this.height * viewScale);
            return true;
        }

        return false;
    }

    update() {
        this.visible = this.inView();
    }

    inView() {
        return (this.x + camera.xOffset > camera.x && this.x < camera.x + camera.viewWidth
            && this.y + camera.yOffset > camera.y && this.y < camera.y + camera.viewHeight);
    }

    collides(x, y) {
        return (x > this.x && y > this.y && x < this.x + this.width * viewScale && y < this.y + this.height * viewScale);
    }
}
