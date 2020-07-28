import { viewScale, cnv, xpToCurrentLevel, xp, coins, startGame, inventory, UIElements, sprites, pickup, tileGrid, extraActors, levelManifest, xpBoundaryForLevel, ItemDrop, Coin, tool, tools, nextTool } from "../main.js";
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

    removeNextDraw = false;

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
        try {
            return this.sprite.cnv;
        } catch (e) {
            console.error('sprite_not_found : ' + this.type, e)
        }
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
    if (el) el.removeNextDraw = true;
    UIElements.push(screen);
}

const screenIsOpen = () => {
    for (let el of UIElements) {
        if (el.type.split('-')[0] == 'screen') return el;
    }
}

export class ToolSelector extends UIElement {
    interactable = true;

    act() {
        nextTool();
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
        ctx.drawImage(sprites[tool].img, this.left + 16, this.top + 16, 32, 32);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.left, this.top - 20, this.width, 20);
        ctx.font = '16px monospace';
        ctx.fillStyle = 'white';
        let textBB = ctx.measureText(tools[tool].uses.toString());
        ctx.fillText(tools[tool].uses.toString(), this.left + this.width / 2 - textBB.width / 2, this.top - 4);
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

        let levelBound = xpBoundaryForLevel(level);
        let nextLevelBound = xpBoundaryForLevel(level + 1);

        let progress = (xp - levelBound) / (nextLevelBound - levelBound);

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
        this.target.removeNextDraw = true;
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
            level: Number(this.type.split('-')[1]),
        })

        extraActors.push(item);

        pickup(item, (placed: any) => {
            if (placed) inventory.removeByTypeAndLevel(this.type.split('-')[0], this.type.split('-')[1]);
            extraActors.splice(extraActors.indexOf(item, 1));
        });

        // add move listener
        // follow touch with item
        // close inventory

        this.parentScreen.removeNextDraw = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        let x = this.left;
        let y = this.top;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';

        ctx.fillRect(x, y, this.width, this.height);
        try {
            ctx.drawImage(sprites[this.type].cnv, x, y);
        } catch (e) {
            console.error('sprite_not_found: ' + this.type, e);
        }

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

export class LevelUpScreen extends Screen {
    title = 'Level Up!';
    color1 = '#ffc800';
    color2 = '#9500ff';
    type = 'screen-levelup';

    rewards;

    populate() {
        let lvl = xpToCurrentLevel(xp);
        this.rewards = levelManifest[lvl]?.rewards || {};

        this.rewards.coin = lvl * lvl * 10;

        if (lvl % 3 == 0) this.rewards.antifog = lvl * 5;


        let n = 0;
        let itemSize = 32;
        let margin = 10;
        let leftPad = 100;
        let topPad = 100;

        for (let r in this.rewards) {
            console.log('adding ', r)
            //TODO different maths to center all items
            let maxCols = Math.floor(1 / ((itemSize + margin) / (this.width - margin * 2 - leftPad * 2)));

            let col = (n % maxCols);

            let row = Math.floor(n / maxCols);

            let x = this.left + col * (itemSize + margin) + margin + leftPad;
            let y = this.top + row * (itemSize + margin) + margin + topPad;

            n++;

            let newItem = new RewardItem({
                left: x,
                top: y,
                type: r,
                count: this.rewards[r],
                sprite: sprites[r],
                height: 32,
                width: 32,
                layer: this.layer + 9,
            }, this)

            UIElements.push(newItem);
            this.children.push(newItem);
        }
    }
}

class RewardItem extends UIElement {
    parentScreen: RewardScreen;
    count: number;

    constructor(opts: { count: number } & IUIOptions, parentScreen: RewardScreen) {
        super(opts);

        this.parentScreen = parentScreen;
    }

    destroy() {
        super.destroy();

        for (let i = 0; i < this.count; i++) {
            let newDrop;
            let dropLeft = this.left + this.width / 2;
            let dropTop = this.top + this.height / 2;


            switch (this.type) {
                case 'coin':
                    newDrop = new Coin({
                        height: 8,
                        layer: this.layer + 1,
                        sprite: sprites[this.type],
                        targetPos: [cnv.width, 0],
                        type: this.type,
                        value: 1,
                        width: 8,
                        left: dropLeft,
                        top: dropTop
                    })
                    break;
                case 'antifog':
                    newDrop = new ItemDrop({
                        height: 8,
                        layer: this.layer + 1,
                        sprite: sprites[this.type],
                        targetPos: [0, cnv.height],
                        type: this.type.split('-')[0],
                        level: this.type.split('-')[1],
                        value: 1,
                        width: 8,
                        left: dropLeft,
                        top: dropTop,
                        finish: () => tools.antifog.addUses(1)
                    })
                    break;
                default:
                    newDrop = new ItemDrop({
                        height: 8,
                        layer: this.layer + 1,
                        sprite: sprites[this.type],
                        targetPos: [cnv.width / 2, 0],
                        type: this.type.split('-')[0],
                        level: this.type.split('-')[1],
                        value: 1,
                        width: 8,
                        left: dropLeft,
                        top: dropTop,
                        finish: () => inventory.addByTypeAndLevel(this.type.split('-')[0], this.type.split('-')[1])

                    })
                    break;
            }

            // newDrop.draw = ()=>'AAAAAA';

            UIElements.push(newDrop);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        let x = this.left;
        let y = this.top;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';

        ctx.fillRect(x, y, this.width, this.height);
        ctx.drawImage(sprites[this.type].cnv, x, y);

        let fontSize = 14;
        ctx.font = fontSize + 'px monospace';
        ctx.fillStyle = 'white';

        ctx.fillText(this.count.toString(), x, y + this.height);
    }
}