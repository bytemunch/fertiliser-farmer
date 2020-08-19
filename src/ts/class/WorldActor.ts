import { Sprite } from './Sprite.js';
import { DEBUG, camera, layers } from '../main.js';

export interface IActorOptions {
    gridPosition: { gridX: number, gridY: number },
    sprite: Sprite,
    droppable?: boolean,
    draggable?: boolean,
    type: string,
    level?: number
}

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

    get ctx(): CanvasRenderingContext2D {
        return layers[this.layer].ctx;
    }

    get cnv(): HTMLCanvasElement {
        return layers[this.layer].cnv;
    }

    draw() {
        if (this.visible) {
            try {
                layers[this.layer].ctx.drawImage(this.img, Math.floor(this.x), Math.floor(this.y));
            } catch (e) {
                console.info(this.layer);
            }
            if (DEBUG.boundingBoxes) layers[this.layer].ctx.strokeRect(this.x, this.y, this.width, this.height);
            return true;
        }

        return false;
    }

    update() {
        this.visible = camera.inView(this);
        // this.visible = true; // camera testing, render everything
    }

    collides(x, y) {
        return (x > this.x * camera.scale && y > this.y * camera.scale && x < (this.x + this.width) * camera.scale && y < (this.y + this.height) * camera.scale);
    }
}
