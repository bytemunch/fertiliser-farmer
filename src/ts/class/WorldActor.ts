import { Sprite } from './Sprite.js';
import { IActorOptions, viewScale, sprites } from '../main.js';
import { Camera } from "./Camera.js";
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

    constructor(opts?: IActorOptions, fromJSON: any = false) {
        this._x = false;
        this._y = false;

        // console.log(fromJSON);

        if (!fromJSON) {
            this.gridX = opts.gridPosition.gridX;
            this.gridY = opts.gridPosition.gridY;

            this.type = opts.type;

            this.layer = opts.layer;

            this.sprite = opts.sprite;
        } else {
            // Load JSON data here
            this.sprite = fromJSON.level ? sprites[fromJSON.type + '-' + fromJSON.level] : sprites[fromJSON.type];
            this.gridX = fromJSON.gridX;
            this.gridY = fromJSON.gridY;
            this.layer = fromJSON.layer;
            this.type = fromJSON.type;
        }
    }

    get img() {
        return this.sprite.cnv;
    }

    get xOffset(): number {
        return this.gridY % 2 ? 0 : 16;
    }

    get yOffset(): number {
        return 0;
    }

    get x() {
        if (this._x === false)
            this._x = (this.gridX * 32 + this.xOffset) * viewScale;
        return this._x;
    }

    get y() {
        if (this._y === false)
            this._y = (this.gridY * 8 + this.yOffset) * viewScale;
        return this._y;
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        if (this.inView(camera)) {
            ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, this.x - camera.x, this.y - camera.y, this.img.width, this.img.height);
            return true;
        }

        return false;

        //if (DEBUG.boundingBoxes) ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.width*viewScale, this.height*viewScale);
    }

    inView(camera: Camera) {
        return (this.x + camera.xOffset > camera.x && this.x < camera.x + camera.viewWidth
            && this.y + camera.yOffset > camera.y && this.y < camera.y + camera.viewHeight);
    }

    collides(x, y) {
        return (x > this.x && y > this.y && x < this.x + this.width * viewScale && y < this.y + this.height * viewScale);
    }
}
