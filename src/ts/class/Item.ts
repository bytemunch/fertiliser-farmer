import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, itemManifest, sprites } from '../main.js';
export class Item extends WorldActor {
    level: number;
    constructor(options?: IActorOptions|any, fromJSON: any = false) {
        super(options, fromJSON);
        this.width = 16;
        this.height = 16;

        if (fromJSON) {
            this.level = fromJSON.level;
        } else {
            this.level = options.level || 1;
        }
    }

    toJSON() {
        return {
            type: this.type,
            layer: this.layer,
            gridX: this.gridX,
            gridY: this.gridY,
            level: this.level
        }
    }

    get xOffset() {
        return this.width / 2 + (this.gridY % 2 == 0 ? this.width : 0);
    }

    get yOffset() {
        return -this.height / 2;
    }

    get draggable() {
        return (tileGrid[this.gridX][this.gridY].tile.type == 'grass');
    }

    draw(ctx, cam) {
        if (tileGrid[this.gridX][this.gridY].tile.type == 'grass')
            return super.draw(ctx, cam);
        return false;
    }

    getConnectedItemsOfSameTypeAndLevel(targetType, targetLevel) {
        let connected = [];
        if (this.gridY % 2) {
            connected.push(tileGrid[this.gridX - 1][this.gridY - 1].contents,
                tileGrid[this.gridX + 0][this.gridY - 1].contents,
                tileGrid[this.gridX + 0][this.gridY + 1].contents,
                tileGrid[this.gridX - 1][this.gridY + 1].contents);
        }
        else {
            connected.push(tileGrid[this.gridX - 0][this.gridY - 1].contents,
                tileGrid[this.gridX + 1][this.gridY - 1].contents,
                tileGrid[this.gridX + 1][this.gridY + 1].contents,
                tileGrid[this.gridX - 0][this.gridY + 1].contents);
        }

        return connected.filter(item => item && item.type == targetType && item.level == targetLevel);
    }

    complete() {
        console.log('Not implemented: Item Completed');
        // Use drop table here
    }

    merge(merger) {

        // check around self for other items of same type
        // build list of connected items of same type
        let connectedItems: Set<Item> = new Set;

        let newLevel = this.level + 1;

        connectedItems.add(merger);

        this.getConnectedItemsOfSameTypeAndLevel(this.type, this.level).forEach(item => connectedItems.add(item));

        let depth = 10;

        for (let i = 0; i < depth; i++) {
            for (let item of connectedItems) {
                // then check around that item
                item.getConnectedItemsOfSameTypeAndLevel(this.type, this.level).forEach(item => connectedItems.add(item));
            }
        }
        connectedItems.add(this);


        if (connectedItems.size < 3)
            return false;

        let numUpgraded = 0;
        let used = 0;


        // group list into 5s
        // merge each group of 5 until list size < 5
        // for each 5 create two levelled up versions
        // remove merged
        if (connectedItems.size >= 5) {
            numUpgraded = Math.floor(connectedItems.size / 5) * 2;
            used = Math.floor(connectedItems.size - connectedItems.size % 5);
        }

        // group into 3s
        // merge 3s
        // for each 3 create one levelled up version
        // remove merged 3s
        if (connectedItems.size % 5 >= 3) {
            numUpgraded++;
            used += 3;
        }

        let leftover = connectedItems.size - used;

        // done
        let i = 0;
        for (let item of connectedItems) {
            tileGrid[item.gridX][item.gridY].contents = null;
            if (i < numUpgraded) {
                if (newLevel > itemManifest[item.type].maxLevel) {
                    item.complete();
                }
                else {
                    tileGrid[item.gridX][item.gridY].contents = new Item({
                        gridPosition: { gridX: item.gridX, gridY: item.gridY },
                        layer: item.layer,
                        sprite: sprites[`${item.type}-${newLevel}`],
                        type: item.type,
                        level: newLevel
                    });
                }
            }
            else if (i < numUpgraded + leftover) {
                tileGrid[item.gridX][item.gridY].contents = new Item({
                    gridPosition: { gridX: item.gridX, gridY: item.gridY },
                    layer: item.layer,
                    sprite: sprites[`${item.type}-${item.level}`],
                    type: item.type,
                    level: item.level
                });
            }

            i++;
        }

        return true;
    }
}
