import { Tile } from './Tile.js';
import { Tool } from './Tool.js';
import { tileGrid, sprites } from '../main.js';
export class AntiFog extends Tool {
    type = 'antifog';
    uses = 0;

    act(x, y) {
        // decrement uses
        if (!super.act(x, y))
            return false;
        // if fog is at x,y
        for (let gtile of tileGrid.flat()) {
            let tile = gtile.tile;
            // remove fog
            if (tile.type != 'fog')
                continue;

            // Account for scaling here
            if (tile.collides(x, y)) {
                tileGrid[tile.gridX][tile.gridY].tile = new Tile({
                    gridPosition: { gridX: tile.gridX, gridY: tile.gridY },
                    sprite: sprites.grass,
                    droppable: true,
                    type: 'grass',
                });
                return true;
            }
        }

        // re-add use as we havent actually cleared
        this.addUses(1);

        return false;
    }
}
