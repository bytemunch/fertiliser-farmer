import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, viewScale, sprites } from '../main.js';
import { pointInPolygon } from '../functions/collision.js';

export const newTileFromJSON = (data) => {
    return new Tile({
        gridPosition: { gridX: data.gridX, gridY: data.gridY },
        layer: data.layer,
        sprite: sprites[data.type],
        type: data.type,
        droppable: data.droppable
    })
}

export class Tile extends WorldActor {
    droppable = false;
    draggedOver = false;
    baseClass = 'tile';
    constructor(opts?: IActorOptions) {
        super(opts);

        this.droppable = opts.droppable;

        this.width = 64;
        this.height = 32;
    }

    toJSON() {
        return {
            type: this.type,
            layer: this.layer,
            gridX: this.gridX,
            gridY: this.gridY,
            droppable: this.droppable
        }
    }

    get contents() {
        return tileGrid[this.gridX][this.gridY].contents;
    }

    get ne() {
        return (this.gridY % 2) ? tileGrid[this.gridX - 1][this.gridY - 1] : tileGrid[this.gridX][this.gridY - 1];
    }

    get nw() {
        return (this.gridY % 2) ? tileGrid[this.gridX][this.gridY - 1] : tileGrid[this.gridX + 1][this.gridY - 1];
    }

    get sw() {
        return (this.gridY % 2) ? tileGrid[this.gridX][this.gridY + 1] : tileGrid[this.gridX + 1][this.gridY + 1];
    }

    get se() {
        return (this.gridY % 2) ? tileGrid[this.gridX - 1][this.gridY + 1] : tileGrid[this.gridX][this.gridY + 1];
    }

    get points() {
        return [
            [(<number>this._x) + this.width / 2, (<number>this._y)],
            [(<number>this._x) + this.width, (<number>this._y) + this.height / 2],
            [(<number>this._x) + this.width / 2, (<number>this._y) + this.height],
            [(<number>this._x), (<number>this._y) + this.height / 2],
        ]
    }

    draw(ctx: CanvasRenderingContext2D, cam) {
        if (!super.draw(ctx, cam)) return false;

        if (this.draggedOver) {
            ctx.fillStyle = '#ff000088';
            ctx.beginPath();
            ctx.moveTo(this.points[0][0] - cam.x, this.points[0][1] - cam.y);
            for (let p of this.points) {
                ctx.lineTo(p[0] - cam.x, p[1] - cam.y);
            }
            ctx.closePath();
            ctx.fill();
        }
        return true;
    }

    collides(x, y) {
        return pointInPolygon(this.points, [x, y]);
    }
}
