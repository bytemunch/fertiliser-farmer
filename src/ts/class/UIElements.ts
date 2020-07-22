import { viewScale, cnv, xpToCurrentLevel, xp, getXpBoundaryForLevel, coins, startGame, inventory, UIElements } from "../main.js";
import { Sprite } from "./Sprite.js";

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
            this.left = cnv.width/2 - this.width/2*viewScale;
        } else if (this.right != undefined) {
            this.left = cnv.width - this.right - this.width * viewScale;
        }

        if (this.centerY) {
            this.top = cnv.height/2 - this.height/2*viewScale;
        } else if (this.bottom != undefined) {
            this.top = cnv.height - this.bottom - this.height * viewScale;
        }
    }

    act() {
        if (!this.interactable) return;
        console.log('Action not implemented!', this);
    }

    draw(ctx) {
        ctx.fillStyle = 'magenta';
        ctx.fillRect(this.left, this.top, this.width * viewScale, this.height * viewScale);
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
        UIElements.push(new InventoryScreen({type:'screen-inventory'}));
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


        let textOffsetTop = this.top + this.height  - 26 * 0.75;

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
    draw(ctx:CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class PlayButton extends UIElement {
    interactable: true;
    act() {
        startGame();
    }

    draw(ctx:CanvasRenderingContext2D) {
        ctx.drawImage(this.img, this.left, this.top, this.width * viewScale, this.height * viewScale);
    }
}

export class InventoryScreen extends UIElement {
    interactable = true;
    constructor(opts) {
        super(opts);

        this.width = cnv.width * 0.9;
        this.left = cnv.width * 0.05;
        this.height = cnv.height * 0.8;
        this.top = cnv.height * 0.1;

        this.populate();
    }

    updatePosition() {
        this.width = cnv.width * 0.9;
        this.left = cnv.width * 0.05;
        this.height = cnv.height * 0.8;
        this.top = cnv.height * 0.1;
    }

    populate() {
        let items = [];

        for (let i in inventory.contents) {
            let item = inventory.contents[i];
            
            items.push(item);
        }
    }

    act() {
        console.log('touched!');
        this.destroy();
    }

    draw(ctx:CanvasRenderingContext2D) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x, this.top, this.width, this.height);
    }
}

class InventoryItem {
    type;
    level;


}