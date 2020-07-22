import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, viewScale } from '../main.js';
export class Tile extends WorldActor {
    droppable = false;
    draggedOver = false;
    constructor(opts?: IActorOptions|any, fromJSON: any = false) {
        super(opts,fromJSON);

        this.droppable = opts.droppable;

        this.width = 64;
        this.height = 32;

        if (fromJSON) {
            this.droppable = fromJSON.droppable;
        }
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

    draw(ctx, cam) {
        ctx.fillStyle = '#ff000088';
        if (this.draggedOver)
            ctx.fillRect(this.x - cam.x + (this.width / 3) * viewScale, this.y - cam.y - (this.height / 3) * viewScale, this.width * 1 / 3 * viewScale, this.height * viewScale);
        return super.draw(ctx, cam);
    }

    collides(x, y) {
        return (x > this.x + this.width / 3 && y > this.y - this.height / 3 && x < this.x + (this.width * (2 / 3)) * viewScale && y < this.y + (this.height - this.height / 3) * viewScale);
    }
}
