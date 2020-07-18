export class Sprite {
    cnv = document.createElement('canvas');

    ctx = this.cnv.getContext('2d');
    sheetWidth: number;
    ready: Promise<any>;

    spriteWidth: number;

    constructor(src, w = 32, h = 32) {
        this.cnv.style.imageRendering = 'pixelated';
        this.ctx.imageSmoothingEnabled = false;

        this.spriteWidth = w;

        let img = new Image();

        this.ready = new Promise(res => {
            img.addEventListener('load', () => {

                this.cnv.width = w;
                this.cnv.height = h;

                this.sheetWidth = img.width;

                this.drawSprite(img);
                res();
            });
        });

        img.src = src;
    }

    drawSprite(img) {
        if (this.sheetWidth > this.spriteWidth) {
            let x = 0;
            // initial draw
            this.ctx.drawImage(img, 0, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);

            // animate
            setInterval(() => {
                this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
                this.ctx.drawImage(img, x, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);
                x += 32;
                if (x >= this.sheetWidth)
                    x = 0;
            }, 666);
        }
        else {

            // no animation
            this.ctx.drawImage(img, 0, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);
        }
    }
}
