import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, sprites, layers, camera, LAYERNUMBERS } from '../main.js';
import { pointInPolygon } from '../functions/collision.js';

export const newTileFromJSON = (data) => {
    return new Tile({
        gridPosition: { gridX: data.gridX, gridY: data.gridY },
        sprite: sprites[data.type],
        type: data.type,
        droppable: data.droppable
    })
}

export class Tile extends WorldActor {
    droppable = false;
    draggedOver = false;
    baseClass = 'tile';
    layer = LAYERNUMBERS.tile;
    
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

    draw() {
        if (!super.draw()) return false;

        if (this.draggedOver) {
            const ctx = layers[this.layer].ctx;
            ctx.fillStyle = '#ff000088';
            ctx.beginPath();
            ctx.moveTo(this.points[0][0], this.points[0][1]);
            for (let p of this.points) {
                ctx.lineTo(p[0], p[1]);
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
