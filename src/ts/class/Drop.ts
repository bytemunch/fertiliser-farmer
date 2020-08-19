import { UIElement, IUIOptions } from './UIElements.js';
import { LAYERNUMBERS, fElapsedTime, camera, layers, extraActors, sprites, addXp, addCoins } from '../main.js';

export interface IDropOptions extends IUIOptions {
    targetPos: number[];
    value: number;
}

export class Drop extends UIElement {
    age = 0;
    directionVector: number[];

    targetDirection: number[];
    value;

    layer = LAYERNUMBERS.item;

    mag = 0;

    constructor(opts: IDropOptions) {
        super(opts);

        this.width = 16;
        this.height = 16;

        this.directionVector = [1 - Math.random() * 2, -1 - Math.random()];

        let dX = opts.targetPos[0] - this.left;
        let dY = opts.targetPos[1] - this.top;

        this.mag = Math.sqrt(dX ** 2 + dY ** 2);

        this.targetDirection = [
            dX / this.mag,
            dY / this.mag
        ];
    }

    update() {
        this.age += fElapsedTime * 5;

        if (this.age < 10) {
            this.top += this.directionVector[1] * fElapsedTime * 5;
        }
        else if (this.age < 20) {
            this.top -= this.directionVector[1] * fElapsedTime * 5;
        }

        if (this.age < 20) {
            this.left += this.directionVector[0] * fElapsedTime * 5;
        }
        else {
            this.left += this.targetDirection[0] * (this.mag / 3) * fElapsedTime;
            this.top += this.targetDirection[1] * (this.mag / 3) * fElapsedTime;
        }

        if (this.left > camera.right || this.top > camera.bottom || this.left < camera.x || this.top < camera.y)
            this.removeNextDraw = true;
    }

    draw() {
        let ctx = layers[this.layer].ctx;

        ctx.drawImage(this.img, this.left, this.top, this.img.width, this.img.height);
    }

    destroy() {
        extraActors.splice(extraActors.indexOf(this), 1);
    }
}

export class XPDrop extends Drop {
    sprite = sprites.xp;

    destroy() {
        super.destroy();
        addXp(this.value);
    }
}

export class Coin extends Drop {
    sprite = sprites.coin;

    destroy() {
        super.destroy();
        addCoins(this.value);
    }
}

export class ItemDrop extends Drop {
    level;

    constructor(opts: IDropOptions & { level?: number | string, finish: () => void }) {
        super(opts);

        this.level = opts.level;
    }

    finish() {
        // set callback in options
        console.log('no callback for ', this)
    }

    destroy() {
        super.destroy();
        this.finish();
    }
}