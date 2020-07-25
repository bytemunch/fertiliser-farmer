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

const openScreen = (screen: Screen) => {
    let el = screenIsOpen();
    if (el) el.destroy();
    UIElements.push(screen);
}

const screenIsOpen = () => {
    for (let el of UIElements) {
        if (el.type.split('-')[0] == 'screen') return el;
    }
}

export class Bank extends UIElement {
    interactable = true;

    act() {
        if (!screenIsOpen()) openScreen(new BankScreen);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class InventoryButton extends UIElement {
    interactable = true;

    act() {
        if (!screenIsOpen()) openScreen(new InventoryScreen)
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class XPBall extends UIElement {
    interactable = true;

    act() {
        if (!screenIsOpen()) openScreen(new RewardScreen);
    }

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

class Screen extends UIElement {
    interactable = false;
    children = [];
    items = [];
    borderw = 4;

    color1 = 'lightblue';
    color2 = 'orange';

    title = 'Unnamed Screen';

    constructor() {
        super({
            height: cnv.height * 0.8,
            width: cnv.width * 0.9,
            left: cnv.width * 0.05,
            top: cnv.height * 0.1,
            layer: 100000,
            sprite: null,
            type: 'screen'
        });

        let closeButton = new CloseButton({
            sprite: sprites.close,
            width: 32,
            height: 32,
            type: 'button-close',
            right: cnv.width * 0.05 - 8,
            top: this.top - 8,
            layer: this.layer + 10
        }, this);
        UIElements.push(closeButton);
        this.children.push(closeButton);

        this.populate();
    }

    populate() {
        console.error('Populate function not implemented!');
    }

    updatePosition() {
        this.width = cnv.width * 0.9;
        this.left = cnv.width * 0.05;
        this.height = cnv.height * 0.8;
        this.top = cnv.height * 0.1;
    }

    destroy() {
        super.destroy();
        for (let c of this.children) {
            c.destroy();
        }
    }

    drawBG(ctx) {
        ctx.fillStyle = this.color1;
        ctx.fillRect(this.x, this.top, this.width, this.height);

        // top border
        ctx.fillStyle = this.color2;
        ctx.fillRect(this.x, this.top, this.width, this.borderw);
        ctx.fillRect(this.x, this.top + 2 * this.borderw, this.width, this.borderw);

        // bottom
        ctx.fillRect(this.x, this.top + this.height - this.borderw, this.width, this.borderw);
        ctx.fillRect(this.x, this.top + this.height - 3 * this.borderw, this.width, this.borderw);

        // left
        ctx.fillRect(this.x, this.top, this.borderw, this.height);
        ctx.fillRect(this.x + this.borderw * 2, this.top, this.borderw, this.height);

        // right
        ctx.fillRect(this.x + this.width - this.borderw, this.top, this.borderw, this.height);
        ctx.fillRect(this.x + this.width - 3 * this.borderw, this.top, this.borderw, this.height);
    }

    drawTitle(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        let fontSize = 26;
        ctx.font = fontSize + 'px monospace';
        ctx.fillText(this.title, this.left + this.borderw * 3 + 2, 2 + this.top + fontSize * .75 + this.borderw * 3);
        ctx.fillStyle = 'white';
        ctx.fillText(this.title, this.left + this.borderw * 3, this.top + fontSize * .75 + this.borderw * 3);
    }

    draw(ctx) {
        this.drawBG(ctx);
        this.drawTitle(ctx);
    }
}

export class InventoryScreen extends Screen {
    title = 'Inventory';
    color1 = '#baff7d';
    color2 = '#ff7dba';

    populate() {
        for (let i in inventory.contents) {
            let item = { type: i, count: inventory.contents[i] };
            this.items.push(item);
        }

        let margin = 10;
        let itemSize = 32;
        let n = 0;

        let topPad = 48;
        let leftPad = 16;

        for (let i of this.items) {
            let maxCols = Math.floor(1 / ((itemSize + margin) / (this.width - margin * 2 - leftPad * 2)));

            let c = (n % maxCols);

            let r = Math.floor(n / maxCols);

            let x = this.left + c * (itemSize + margin) + margin + leftPad;
            let y = this.top + r * (itemSize + margin) + margin + topPad;

            n++;

            let newItem = new InventoryItem({
                left: x,
                top: y,
                type: i.type,
                sprite: sprites[i.type],
                height: 32,
                width: 32,
                layer: this.layer + 9
            }, this)

            this.children.push(newItem);
            UIElements.push(newItem);
        }
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

class BankScreen extends Screen {
    title = 'Bank';
    color1 = 'orange';
    color2 = 'green';
    type = 'screen-bank';
}

class RewardScreen extends Screen {
    title = 'Rewards';
    color1 = 'lightblue';
    color2 = 'orange';
    type = 'screen-rewards';
}