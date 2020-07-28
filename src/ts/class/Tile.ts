import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, viewScale, sprites } from '../main.js';

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

    draw(ctx, cam) {
        ctx.fillStyle = '#ff000088';
        if (this.draggedOver)
            ctx.fillRect(this.x - cam.x + (this.width / 3) * viewScale, this.y - cam.y - (this.height / 3) * viewScale, this.width * 1 / 3 * viewScale, this.height * viewScale);
        return super.draw(ctx, cam);
    }

    dragCollides(x, y) {
        return (x > this.x + this.width / 3 && y > this.y - this.height / 3 && x < this.x + (this.width * (2 / 3)) * viewScale && y < this.y + (this.height - this.height / 3) * viewScale);
    }
}
