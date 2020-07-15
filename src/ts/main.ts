let DEBUG = {
    boundingBoxes: false,
}

let cnv = document.createElement('canvas');
cnv.style.imageRendering = 'pixelated';
let ctx = cnv.getContext('2d');
ctx.imageSmoothingEnabled = false;

let contentDiv: HTMLDivElement;

let loop = false;

let worldWidth = 50;

let worldHeight = worldWidth * 2;

let viewScale = 1.5;

class Sprite {
    cnv = document.createElement('canvas');

    ctx = this.cnv.getContext('2d');
    sheetWidth: number;
    ready: Promise<any>;

    constructor(src, w = 32, h = 32) {
        this.cnv.style.imageRendering = 'pixelated';
        this.ctx.imageSmoothingEnabled = false;

        let img = new Image();

        this.ready = new Promise(res => {
            img.addEventListener('load', () => {

                this.cnv.width = w;
                this.cnv.height = h;

                this.sheetWidth = img.width;

                this.drawSprite(img);
                res()
            });
        })

        img.src = src;
    }

    drawSprite(img) {
        if (this.sheetWidth > 32) {
            let x = 0;
            // initial draw
            this.ctx.drawImage(img, 0, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);

            // animate
            setInterval(() => {
                this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
                this.ctx.drawImage(img, x, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);
                x += 32;
                if (x >= this.sheetWidth) x = 0;
            }, 666);
        } else {

            // no animation
            this.ctx.drawImage(img, 0, 0, this.cnv.width, this.cnv.height, 0, 0, this.cnv.width, this.cnv.height);
        }


    }
}

interface IActorOptions {
    gridPosition: { gridX: number, gridY: number },
    sprite: Sprite,
    layer: number,
    droppable?: boolean,
    draggable?: boolean
}

abstract class WorldActor {
    _x: number;
    _y: number;

    gridX: number;
    gridY: number;

    sprite: Sprite;

    layer: number;

    width: number;
    height: number;


    constructor(opts: IActorOptions) {
        this.gridX = opts.gridPosition.gridX;
        this.gridY = opts.gridPosition.gridY;


        this.layer = opts.layer;

        this.sprite = opts.sprite;
    }

    get img() {
        return this.sprite.cnv;
    }

    get xOffset(): number {
        return this.gridY % 2 ? 0 : 16;
    }

    get yOffset(): number {
        return 0;
    }

    get x() {
        if (!this._x) this._x = (this.gridX * 32 + this.xOffset) * viewScale;
        return this._x;
    }

    get y() {
        if (!this._y) this._y = (this.gridY * 8 + this.yOffset) * viewScale;
        return this._y;
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        if (camera.inView(this)) ctx.drawImage(this.img, this.x - camera.x, this.y - camera.y, this.img.width * viewScale, this.img.height * viewScale);

        //if (DEBUG.boundingBoxes) ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.width*viewScale, this.height*viewScale);
    }

    collides(x, y) {
        return (x > this.x && y > this.y && x < this.x + this.width * viewScale && y < this.y + this.height * viewScale);
    }
}

class Tile extends WorldActor {
    droppable = false;
    draggedOver = false;
    constructor(opts: IActorOptions) {
        super(opts);

        this.droppable = opts.droppable;

        this.width = 32;
        this.height = 16;
    }

    draw(ctx, cam) {
        super.draw(ctx, cam);
        ctx.fillStyle = '#ff000088';
        if (this.draggedOver) ctx.fillRect(this.x - cam.x + (this.width/3)*viewScale, this.y - cam.y - (this.height / 3) * viewScale, this.width * 1/3 * viewScale, this.height * viewScale);
    }

    collides(x, y) {
        return (x > this.x + this.width / 3 && y > this.y - this.height / 3 && x < this.x + (this.width * (2 / 3)) * viewScale && y < this.y + (this.height - this.height / 3) * viewScale);
    }
}

class Item extends WorldActor {
    draggable = true;
    constructor(options: IActorOptions) {
        super(options)
        this.width = 16;
        this.height = 16;
    }

    get xOffset() {
        return this.width / 2 + (this.gridY % 2 == 0 ? this.width : 0);
    }

    get yOffset() {
        return -this.height / 2;
    }

    draw(ctx, cam) {
        super.draw(ctx, cam);

        if (DEBUG.boundingBoxes) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(this.x - cam.x, this.y - cam.y, this.width * viewScale, this.height * viewScale);
        }
    }
}

interface IActor {
    x: number,
    y: number,
    width: number,
    height: number
}

class Camera {
    x: number = 0;
    y: number = 0;
    viewWidth: number = 470;
    viewHeight: number = 350;

    hBounds: number;
    vBounds: number;

    xOffset = 32 * viewScale;
    yOffset = 48 * viewScale;

    constructor() {
        this.viewWidth = cnv.width + this.xOffset;
        this.viewHeight = cnv.height + this.yOffset;

        this.hBounds = (worldWidth * 32 * viewScale) - this.viewWidth + this.xOffset;
        this.vBounds = (worldHeight * 8 * viewScale) - this.viewHeight + this.yOffset;

        this.move();
    }

    move(xAmt = 0, yAmt = 0) {
        if (this.x + xAmt > this.hBounds) {
            this.x = this.hBounds;
        } else if (this.x + xAmt < this.xOffset / 2) {
            this.x = this.xOffset / 2;
        } else {
            this.x += xAmt;
        }

        if (this.y + yAmt > this.vBounds) {
            this.y = this.vBounds;
        } else if (this.y + yAmt < 8 * viewScale) {
            this.y = 8 * viewScale;
        } else {
            this.y += yAmt;
        }
    }

    inView(actor: IActor) {
        return (actor.x + this.xOffset > this.x && actor.x < this.x + this.viewWidth
            && actor.y + this.yOffset > this.y && actor.y < this.y + this.viewHeight);
    }
}

let camera;

let sprites: { [x: string]: Sprite } = {};

interface IGridTile {
    type: string,
    tile: Tile,
    contents: any
}

let tileGrid: IGridTile[][] = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('YEET');
    loaded();
})

const loadSprites = () => {
    let loadPromises: Promise<any>[] = [];

    sprites.grass = new Sprite('./img/tiles/grass.png', 32, 48);
    loadPromises.push(sprites.grass.ready);

    sprites.water = new Sprite('./img/tiles/water.png', 32, 16);
    loadPromises.push(sprites.water.ready);

    sprites.shit = new Sprite('./img/items/shit.png');
    loadPromises.push(sprites.shit.ready);

    return Promise.allSettled(loadPromises);
}


const startLoop = () => {
    loop = true;
    requestAnimationFrame(rAFLoop);
}

const loaded = async () => {
    contentDiv = document.querySelector('#content');

    let cBB = contentDiv.getBoundingClientRect();

    let cBBStyle = getComputedStyle(contentDiv);

    let gameW = cBB.width - Number(cBBStyle.borderWidth.replace('px', '')) * 2 - Number(cBBStyle.paddingLeft.replace('px', '')) - Number(cBBStyle.paddingRight.replace('px', ''))
    let gameH = cBB.height - Number(cBBStyle.borderWidth.replace('px', '')) * 2 - Number(cBBStyle.paddingTop.replace('px', '')) - Number(cBBStyle.paddingBottom.replace('px', ''))

    cnv.width = gameW;
    cnv.height = gameH;

    camera = new Camera;

    contentDiv.appendChild(cnv);

    await loadSprites();
    // start making tiles here

    // initialize array
    for (let i = 0; i < worldWidth; i++) {
        tileGrid[i] = [];
        for (let j = 0; j < worldHeight; j++) {
            tileGrid[i][j] = {
                type: 'water',
                contents: '',
                tile: new Tile({
                    gridPosition: { gridX: i, gridY: j },
                    layer: 0,
                    sprite: sprites.water
                })
            }
        }
    }

    let waterBorder = 1;

    for (let i = waterBorder; i < worldWidth - waterBorder; i++) {
        for (let j = waterBorder * 2; j < worldHeight - waterBorder * 4; j++) {
            let layer = 1;

            if (Math.random() < 0.1) tileGrid[i][j] = {
                type: 'grass',
                tile: new Tile({
                    gridPosition: { gridX: i, gridY: j },
                    layer,
                    sprite: sprites.grass,
                    droppable: true
                }),
                contents: Math.random() > 0 ? new Item({
                    gridPosition: { gridX: i, gridY: j },
                    layer: layer + 10,
                    sprite: sprites.shit
                }) : null,
            }
        }
    }

    startLoop();
}

const flattenArray = array2D => {
    let flatArray = [];

    array2D.forEach(row => row.filter(gridSq => camera.inView(gridSq.tile)).forEach(gridSq => {
        flatArray.push(gridSq.tile);
        if (gridSq.contents) flatArray.push(gridSq.contents)
    }));

    return flatArray;
}

let fps = 0;
let lastT = 0;
let frameTime = 0;

let prevFPSs = [];

let avgFps;

const avg = (arr) => {
    let rt = 0;
    for (let a of arr) {
        rt += a;
    }

    return rt / arr.length;
}

const rAFLoop = (t: DOMHighResTimeStamp) => {
    ctx.translate(-0.5, -0.5);
    frameTime = t - lastT;
    fps = 1000 / frameTime;
    lastT = t;

    prevFPSs.push(fps);

    if (prevFPSs.length > 30) prevFPSs.shift();

    avgFps = avg(prevFPSs);


    ctx.clearRect(0, 0, cnv.width, cnv.height);

    let flatArray = flattenArray(tileGrid);


    flatArray.sort((a, b) => a.y - b.y);

    flatArray.sort((a, b) => a.layer - b.layer);


    for (let actor of flatArray) {
        (<WorldActor>actor).draw(ctx, camera);
    }

    handleInput();

    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(avgFps.toFixed(2), 10, 20);

    ctx.resetTransform();

    if (loop) requestAnimationFrame(rAFLoop);
}

let keysHeld: { [key: string]: boolean } = {};

document.addEventListener('keydown', e => {
    keysHeld[e.key.toLowerCase()] = true;
})

document.addEventListener('keyup', e => {
    keysHeld[e.key.toLowerCase()] = false;
})

// do this in-class?
const handleInput = () => {
    let moveSpeed = 0.2 * frameTime;
    if (keysHeld['shift']) moveSpeed = 2 * frameTime;
    if (keysHeld['w']) {
        camera.move(0, -moveSpeed);
    } else if (keysHeld['s']) {
        camera.move(0, moveSpeed);
    }
    if (keysHeld['a']) {
        camera.move(-moveSpeed, 0);
    } else if (keysHeld['d']) {
        camera.move(moveSpeed, 0);
    }
}

cnv.addEventListener('touchstart', e => {
    let targetBB = (<HTMLElement>e.target).getBoundingClientRect();
    let startX = e.touches[0].pageX - targetBB.x + camera.x;
    let startY = e.touches[0].pageY - targetBB.y + camera.y;

    let x = startX;
    let y = startY;

    for (let actor of flattenArray(tileGrid)) {
        actor = actor as Item;
        if (!actor.draggable) continue;

        if (actor.collides(x, y)) {
            let dragged: Item = actor;

            x -= (dragged.width / 2) * viewScale;
            y -= (dragged.height / 2) * viewScale;

            const moveHandler = e => {
                x = e.touches[0].pageX - targetBB.x + camera.x;
                y = e.touches[0].pageY - targetBB.y + camera.y;

                dragged._x = x - (dragged.width / 2) * viewScale;
                dragged._y = y - (dragged.height / 2) * viewScale;

                for (let tile of flattenArray(tileGrid)) {
                    tile = tile as Tile;
                    if (!tile.droppable) continue;

                    tile.draggedOver = false;

                    if (tile.collides(x, y)) {
                        tile.draggedOver = true;
                    }
                }
            };

            const endHandler = e => {
                let dropped = false;

                for (let tile of flattenArray(tileGrid)) {
                    tile = tile as Tile;
                    if (!tile.droppable) continue;

                    tile.draggedOver = false;

                    if (tile.collides(x, y)) {
                        dropped = tile;
                        // set dragged position to dropped grid
                        dragged.gridX = tile.gridX;
                        dragged.gridY = tile.gridY;
                        break;
                    }
                }

                dragged._x = 0;
                dragged._y = 0;

                cnv.removeEventListener('touchmove', moveHandler);
                cnv.removeEventListener('touchend', endHandler);
            }

            cnv.addEventListener('touchmove', moveHandler);
            cnv.addEventListener('touchend', endHandler);

            break;
        }
    }
})