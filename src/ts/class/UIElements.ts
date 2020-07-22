import { viewScale, cnv, xpToCurrentLevel, xp, getXpBoundaryForLevel, coins, startGame, inventory, UIElements, sprites, pickup, tileGrid, extraActors } from "../main.js";
import { Sprite } from "./Sprite.js";
import { Item } from "./Item.js";

export class UIElement {
    left = 0;
    right: number;
    top = 0;
    bottom: number;
    width = 0;
    height = 0;
    layer = 0;
    type: string;
    interactable: boolean;
    sprite: Sprite;
    centerX: boolean;
    centerY: boolean;

    constructor(opts: IUIOptions) {
        for (let o in opts) {
            this[o] = opts[o];
        }
        this.layer += 10000;

        this.updatePosition();
    }

    updatePosition() {

        if (this.centerX) {
            this.left = cnv.width / 2 - this.width / 2 * viewScale;
        } else if (this.right != undefined) {
            this.left = cnv.width - this.right - this.width * viewScale;
        }

        if (this.centerY) {
            this.top = cnv.height / 2 - this.height / 2 * viewScale;
        } else if (this.bottom != undefined) {
            this.top = cnv.height - this.bottom - this.height * viewScale;
        }
    }

    act() {
        if (!this.interactable) return;
        console.log('Action not implemented!', this);
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }

    destroy() {
        UIElements.splice(UIElements.indexOf(this), 1);
    }

    get img() {
        return this.sprite.cnv;
    }

    get x() {
        return this.left;
    }

    get y() {
        return this.top;
    }

    collidePoint(x, y) {
        return (x > this.x && y > this.y && x < this.x + this.width * viewScale && y < this.y + this.height * viewScale);

    }
}

export interface IUIOptions {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
    width: number;
    height: number;
    layer: number;
    type: string;
    sprite: Sprite;
}

export class Bank extends UIElement {
    interactable = true;

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class InventoryButton extends UIElement {
    interactable = true;

    act() {
        for (let el of UIElements) {
            if (el.type.split('-')[0] == 'screen') el.destroy();
        }
        UIElements.push(new InventoryScreen({ type: 'screen-inventory' }));
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class XPBall extends UIElement {
    interactable = true;

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);

        let level = xpToCurrentLevel(xp);

        ctx.font = '26px monospace';


        let textOffsetTop = this.top + this.height - 26 * 0.75;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(level.toString(), this.left + 28, textOffsetTop + 2);

        ctx.fillStyle = 'white';
        ctx.fillText(level.toString(), this.left + 26, textOffsetTop);

        let levelBound = getXpBoundaryForLevel(level);
        let nextLevelBound = getXpBoundaryForLevel(level + 1);

        let progress = (xp - levelBound) / (nextLevelBound - levelBound);

        // console.log(progress);

        this.sprite.animationState = Math.floor(progress * 26);
    }
}

export class CoinDisplay extends UIElement {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.left, this.top, this.width * viewScale, this.height * viewScale);

        let fontSize = 16;
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = 'white';
        ctx.fillText(coins.toString().padStart(10, '0'), this.left + this.img.width + 4, this.top + fontSize * 0.9);
        ctx.drawImage(this.img, this.left, this.top, this.img.width, this.img.height);
    }
}

export class XPDisplay extends UIElement {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.left, this.top, this.width * viewScale, this.height * viewScale);

        let fontSize = 16;
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = 'white';

        //@ts-ignore
        ctx.fillText(xp.toString().padStart(10, '0'), this.left + this.img.width + 4, this.top + fontSize * 0.9);
        ctx.drawImage(this.img, this.left + 2, this.top, this.img.width, this.img.height);
    }
}

export class DrawnSprite extends UIElement {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class PlayButton extends UIElement {
    interactable = true;
    act() {
        startGame();
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

class CloseButton extends UIElement {
    interactable = true;
    target;
    constructor(opts: IUIOptions, target) {
        super(opts);
        this.target = target;
    }

    act() {
        this.target.destroy();
    }
}

export class InventoryScreen extends UIElement {
    interactable = false;
    children = [];
    items = [];
    constructor(opts) {
        super(opts);

        this.width = cnv.width * 0.9;
        this.left = cnv.width * 0.05;
        this.height = cnv.height * 0.8;
        this.top = cnv.height * 0.1;

        this.populate();

        let closeButton = new CloseButton({
            sprite: sprites.close,
            width: 32,
            height: 32,
            type: 'button-close',
            right: cnv.width * 0.05,
            top: this.top,
            layer: 10
        }, this);
        UIElements.push(closeButton);
        this.children.push(closeButton);
    }

    updatePosition() {
        this.width = cnv.width * 0.9;
        this.left = cnv.width * 0.05;
        this.height = cnv.height * 0.8;
        this.top = cnv.height * 0.1;
    }

    populate() {
        for (let i in inventory.contents) {
            let item = { type: i, count: inventory.contents[i] };
            this.items.push(item);
        }

        let margin = 10;
        let itemSize = 32;
        let c = 1;

        for (let i of this.items) {
            c++;
            let x = this.left + c * (itemSize + margin);
            let y = this.top + (c % (this.width / (itemSize + margin)) * itemSize);

            let newItem = new InventoryItem({
                left: x,
                top: y,
                type: i.type,
                sprite: sprites[i.type],
                height: 32,
                width: 32,
                layer: 9
            }, this)

            this.children.push(newItem);
            UIElements.push(newItem);
        }
    }

    act() {
        console.log('touched!');
        this.destroy();
    }

    destroy() {
        super.destroy();
        for (let c of this.children) {
            c.destroy();
        }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x, this.top, this.width, this.height);
    }
}

class InventoryItem extends UIElement {
    interactable = true;
    parentScreen: InventoryScreen;

    constructor(opts: IUIOptions, parentScreen: InventoryScreen) {
        super(opts);

        this.parentScreen = parentScreen;
    }

    act() {
        console.log('click', this)
        // add move listeners etc.

        // create item
        let item = new Item({
            gridPosition: { gridX: -1, gridY: -1 },
            layer: 500,
            sprite: sprites[this.type],
            type: this.type.split('-')[0],
            level: Number(this.type.split('-')[1])
        })

        extraActors.push(item);

        pickup(item, (placed: any) => {
            if (placed) inventory.removeByTypeAndLevel(this.type.split('-')[0], this.type.split('-')[1]);
            extraActors.splice(extraActors.indexOf(item, 1));
        });

        // add move listener
        // follow touch with item
        // close inventory

        this.parentScreen.destroy();
    }

    draw(ctx: CanvasRenderingContext2D) {
        let x = this.left;
        let y = this.top;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';

        ctx.fillRect(x, y, this.width, this.height);
        ctx.drawImage(sprites[this.type].cnv, x, y);

        ctx.font = '14px monospace';
        ctx.fillStyle = 'white';

        ctx.fillText(inventory.contents[this.type].toString(), x, y + this.height);
    }
}