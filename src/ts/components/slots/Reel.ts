import Observable from "../../class/Observable.js";
import applyMixins from "../../functions/applyMixins.js";
import fisherYates from "../../functions/fisherYates.js";

const odds = {
    'wild': 4,
    'poop': 3,
    'banana': 3,
    'cherry': 3,
    'bar': 2,
    '2bar': 2,
    '3bar': 2,
    'bag': 1,
    '7': 1,
    'diamond': 1,
}

const totalOdds = (() => {
    let to = 0;
    for (let o in odds) {
        to += odds[o];
    }
    // if (to % 2 == 0) 
    return to;
})()

class Fruit {
    type: string = '';
    img: HTMLImageElement;
    y: number = 64 / 2 - 48 / 2;
    loaded: Promise<void>;

    constructor(type: string) {
        if (!type) throw 'Cannot initialise fruit with no type!';
        this.type = type;

        this.loaded = new Promise(res => {
            this.img = new Image;
            this.img.addEventListener('load', e => {
                res();
            })
            this.img.src = './img/fruits/' + type + '.png';
        })

        applyMixins(Fruit, [Observable]);
    }

    draw(ctx: CanvasRenderingContext2D, spin: boolean) {
        if (spin) {
            this.y += 10;
        } else {
            // align everything to winline
            this.y = 8 + Math.floor(this.y / 64) * 64;
        }
        ctx.drawImage(this.img, 0, this.y);
        if (this.y > 64) {
            // reset to top
            this.y = -64 * (totalOdds - 1);
        }
    }
}

class Reel extends HTMLElement {
    cnv: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    spinning: boolean = false;
    finished: boolean = false;

    // TODO unlink from framerate
    spinDuration: number = 0;
    spinAge: number = 0;

    fruits: Fruit[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        applyMixins(Reel, [Observable]);

        this.cnv = document.createElement('canvas');

        this.cnv.width = 48;
        this.cnv.height = 64;

        this.ctx = this.cnv.getContext('2d');

    }

    init(reelNum: number) {
        this.spinDuration = 3 * 60 + reelNum / 3 * 100;
    }

    async connectedCallback() {
        this.shadowRoot.appendChild(this.cnv);
        this.emit('test', 'abcd');

        await this.setup();

        this.draw();

        this.spin();

    }

    async setup() {
        this.fruits = [];
        this.spinAge = 0;

        for (let t in odds) {
            for (let i = 0; i < odds[t]; i++) {
                this.fruits.push(new Fruit(t));
            }
        }

        fisherYates(this.fruits);

        // Winline is at array[length-1];

        for (let i = 0; i < this.fruits.length; i++) {
            this.fruits[i].y -= i * 64;
        }

        return Promise.allSettled(this.fruits.map(f => f.loaded));
    }

    async spin() {
        if (this.spinning) return;

        await this.setup();

        this.spinning = true;
    }

    stop() {
        this.spinAge = this.spinDuration;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
        // UPDATE
        if (this.spinning) {
            this.spinAge++;
            if (this.spinAge >= this.spinDuration) {
                this.spinning = false;
                this.emit('win', this.fruits.filter(el => el.y > 0 && el.y < 64)[0].type);
            }
        }

        // DRAW
        for (let f of this.fruits) {
            f.draw(this.ctx, this.spinning);
        }

        // OVERLAY
        this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.cnv.height / 2);
        this.ctx.lineTo(this.cnv.width, this.cnv.height / 2);
        this.ctx.closePath();
        this.ctx.stroke();
    }
}

interface Reel extends Observable { };

export default Reel;