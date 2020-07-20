import { viewScale } from "../main.js";

export class Sprite {
    cnv = document.createElement('canvas');

    ctx = this.cnv.getContext('2d');
    sheetWidth: number;
    ready: Promise<any>;

    spriteWidth: number;
    spriteHeight: number;

    animate: string = 'loop';
    animationState: number = 0;
    frameRate: number = 10;

    img: HTMLImageElement;

    constructor(src, w = 32, h = 32) {
        this.ctx.imageSmoothingEnabled = false;

        document.body.appendChild(this.cnv);

        this.spriteWidth = w;
        this.spriteHeight = h;

        this.img = new Image();

        this.ready = new Promise(res => {
            this.img.addEventListener('load', () => {
                this.cnv.width = w * viewScale;
                this.cnv.height = h * viewScale;

                this.sheetWidth = this.img.width;

                this.drawSprite();
                res();
            });
        });

        this.img.src = src;
    }

    reDraw() {
        this.drawSprite();
    }

    drawSprite() {
        switch (this.animate) {
            case 'loop':
                // initial draw
                this.ctx.drawImage(this.img, 0, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);

                // animate
                setInterval(() => {
                    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
                    this.ctx.drawImage(this.img, this.animationState, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);
                    this.animationState += this.spriteWidth;
                    if (this.animationState >= this.sheetWidth)
                        this.animationState = 0;
                }, (1 / this.frameRate) * 1000);
                break;
            default:
                this.ctx.drawImage(this.img, this.animationState * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);
                setInterval(() => {
                    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
                    this.ctx.drawImage(this.img, this.animationState*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);
                }, (1 / this.frameRate) * 1000);
                break;
        }
    }
}
