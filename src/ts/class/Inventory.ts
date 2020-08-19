import { Item } from './Item.js';

export interface IInventoryContents {
    [itemTypeAndLevel: string]: number
}

export class Inventory {
    contents: IInventoryContents = {};

    addItem(item: Item) {
        this.addByTypeAndLevel(item.type, item.level);
    }

    removeItem(item: Item) {
        this.removeByTypeAndLevel(item.type, item.level);
    }

    addByTypeAndLevel(type, level) {
        let typeStr = type + '-' + level;
        if (!this.contents[typeStr])
            this.contents[typeStr] = 0;
        this.contents[typeStr]++;
    }

    removeByTypeAndLevel(type, level) {
        let typeStr = type + '-' + level;
        if (!this.contents[typeStr])
            this.contents[typeStr] = 0;
        this.contents[typeStr]--;
        if (this.contents[typeStr] <= 0)
            delete this.contents[typeStr];
    }

    toJSON() {
        return this.contents;
    }
}
