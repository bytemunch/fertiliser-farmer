import { WorldActor } from './WorldActor.js';
import { IActorOptions, tileGrid, itemManifest, sprites, UIElements, randInRange, camera, dropManifest, Coin, cnv, XPDrop, ItemDrop, inventory } from '../main.js';

export const newItemFromJSON = (data) => {
    return new Item({
        gridPosition: { gridX: data.gridX, gridY: data.gridY },
        layer: data.layer,
        sprite: sprites[data.type + '-' + data.level],
        level: data.level,
        type: data.type
    })
}
export class Item extends WorldActor {
    level: number;
    constructor(options?: IActorOptions) {
        super(options);
        this.width = 32;
        this.height = 32;
        this.level = options.level || 1;
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
        if ((this.gridX == -1 || this.gridY == -1) || tileGrid[this.gridX][this.gridY].tile.type == 'grass')
            return super.draw(ctx, cam);
        return false;
    }

    getConnectedItemsOfSameTypeAndLevel(targetType, targetLevel) {
        let tile = tileGrid[this.gridX][this.gridY].tile;
        let connected = [tile.ne.contents, tile.nw.contents, tile.sw.contents, tile.se.contents];

        return connected.filter(item => item && item.type == targetType && item.level == targetLevel);
    }

    get screenX() {
        return this.x - camera.x;
    }

    get screenY() {
        return this.y - camera.y;
    }

    complete() {
        // console.log('Not implemented: Item Completed');
        // Use drop table here

        for (let drop in itemManifest[this.type].dropTable) {
            let nums = itemManifest[this.type].dropTable[drop];
            let amt = randInRange(nums[0], nums[1]);

            for (let i = 0; i < amt; i++) {
                switch (drop) {
                    case 'coin':
                        UIElements.push(new Coin({
                            left: this.screenX,
                            top: this.screenY,
                            height: 16,
                            width: 16,
                            layer: 5,
                            type: 'coin',
                            sprite: sprites.coin,
                            targetPos: [cnv.width, 0],
                            value: 1
                        }))
                        break;
                    case 'xp':
                        UIElements.push(new XPDrop({
                            left: this.screenX,
                            top: this.screenY,
                            height: 16,
                            width: 16,
                            layer: 5,
                            type: 'xp',
                            sprite: sprites.xp,
                            targetPos: [0, 0],
                            value: 10
                        }))
                        i += 9;
                        break;
                    default:
                        let droppedItem = new ItemDrop({
                            left: this.screenX,
                            top: this.screenY,
                            height: 16,
                            width: 16,
                            layer: 5,
                            type: drop.split('-')[0],
                            sprite: sprites[drop],
                            targetPos: [cnv.width / 2, 0],
                            value: 1,
                            finish: ()=>inventory.addByTypeAndLevel(drop.split('-')[0], drop.split('-')[1])
                        });
                        droppedItem.level = drop.split('-')[1];
                        UIElements.push(droppedItem);
                        // console.log('Drop not implemented:', drop);
                        break;
                }
            }
        }
    }

    dropXpForMerge(numUpgraded) {
        let numBalls = numUpgraded * (itemManifest[this.type].dropTable.xp[0] / 10) * this.level;
        for (let i = 0; i < numBalls; i++) {
            UIElements.push(new XPDrop({
                left: this.screenX,
                top: this.screenY,
                height: 8,
                width: 8,
                layer: 5,
                type: 'xp',
                sprite: sprites.coin,
                targetPos: [0, 0],
                value: Math.floor(itemManifest[this.type].dropTable.xp[0] / 20)
            }))
        }
    }

    merge(merger) {

        // check around self for other items of same type
        // build list of connected items of same type
        let connectedItems: Set<Item> = new Set;

        let newLevel = this.level + 1;

        connectedItems.add(merger);

        // this.getConnectedItemsOfSameTypeAndLevel(this.type, this.level).forEach(item => connectedItems.add(item));

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
            if (item.gridX != -1 && item.gridY != -1) tileGrid[item.gridX][item.gridY].contents = null;
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

        this.dropXpForMerge(numUpgraded);

        return true;
    }
}
