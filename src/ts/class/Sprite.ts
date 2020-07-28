import { viewScale, frameCount } from "../main.js";

export class Sprite {
    cnv: OffscreenCanvas;
    ctx;
    sheetWidth: number;
    ready: Promise<any>;

    spriteWidth: number;
    spriteHeight: number;

    animate: string = 'loop';
    animationState: number = 0;
    frameRate: number = 30;

    img: HTMLImageElement;

    drawFinished = false;

    constructor(src, w = 32, h = 32) {
        this.cnv = new OffscreenCanvas(w, h);
        this.ctx = this.cnv.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.spriteWidth = w;
        this.spriteHeight = h;

        this.img = new Image();

        this.ready = new Promise(res => {
            this.img.addEventListener('load', () => {
                this.cnv.width = w * viewScale;
                this.cnv.height = h * viewScale;

                this.sheetWidth = this.img.width;

                this.draw();
                res();
            });
        });

        this.img.src = src;
    }

    draw() {
        const drawImage = () => {
            this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
            this.ctx.drawImage(this.img, this.animationState * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);
        }

        switch (this.animate) {
            case 'loop':
                // initial draw
                // this.ctx.drawImage(this.img, 0, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);

                // animate
                if (frameCount % this.frameRate == 0) {
                    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
                    this.ctx.drawImage(this.img, this.animationState, 0, this.spriteWidth, this.spriteHeight, 0, 0, this.cnv.width, this.cnv.height);
                    this.animationState += this.spriteWidth;
                    if (this.animationState >= this.sheetWidth)
                        this.animationState = 0;
                }

                break;
            case 'stepped':
                drawImage();
                break;
            default:
                if (this.drawFinished) return;
                drawImage()
                this.drawFinished = true;
                break;
        }
    }
}
