import { makeNoise3D } from '../lib/osn.js';

let DEBUG = {
    boundingBoxes: false,
}

let version;

(async () => {
    version = await (await fetch('./version')).text();
})();

let cnv = document.createElement('canvas');
cnv.style.imageRendering = 'pixelated';
let ctx = cnv.getContext('2d');
ctx.imageSmoothingEnabled = false;

window.addEventListener('resize', () => {
    cnv.height = window.innerHeight;
    cnv.width = window.innerWidth;

    camera.resized();
})

let contentDiv: HTMLDivElement;

let loop = false;

let worldWidth = 50;

let worldHeight = worldWidth * 2;

let viewScale = 1.5;

let itemManifest = {
    'shit': {
        maxLevel: 5,
        dropTable: {
            coin: [3, 5],
            shit: [1, 3]
        }
    }
}

class Sprite {
    cnv = document.createElement('canvas');

    ctx = this.cnv.getContext('2d');
    sheetWidth: number;
    ready: Promise<any>;

    spriteWidth: number

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
                res()
            });
        })

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
    draggable?: boolean,
    type: string,
    level?: number
}

abstract class WorldActor {
    _x: number | false;
    _y: number | false;

    gridX: number;
    gridY: number;

    sprite: Sprite;

    layer: number;

    width: number;
    height: number;

    type;


    constructor(opts: IActorOptions) {
        this._x = false;
        this._y = false;

        this.gridX = opts.gridPosition.gridX;
        this.gridY = opts.gridPosition.gridY;

        this.type = opts.type;

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
        if (this._x === false) this._x = (this.gridX * 32 + this.xOffset) * viewScale;
        return this._x;
    }

    get y() {
        if (this._y === false) this._y = (this.gridY * 8 + this.yOffset) * viewScale;
        return this._y;
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        if (this.inView(camera)) {
            ctx.drawImage(this.img, this.x - camera.x, this.y - camera.y, this.img.width * viewScale, this.img.height * viewScale);
            return true;
        }

        return false;

        //if (DEBUG.boundingBoxes) ctx.strokeRect(this.x - camera.x, this.y - camera.y, this.width*viewScale, this.height*viewScale);
    }

    inView(camera: Camera) {
        return (this.x + camera.xOffset > camera.x && this.x < camera.x + camera.viewWidth
            && this.y + camera.yOffset > camera.y && this.y < camera.y + camera.viewHeight);
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

    get contents() {
        return tileGrid[this.gridX][this.gridY].contents;
    }

    draw(ctx, cam) {
        ctx.fillStyle = '#ff000088';
        if (this.draggedOver) ctx.fillRect(this.x - cam.x + (this.width / 3) * viewScale, this.y - cam.y - (this.height / 3) * viewScale, this.width * 1 / 3 * viewScale, this.height * viewScale);
        return super.draw(ctx, cam);
    }

    collides(x, y) {
        return (x > this.x + this.width / 3 && y > this.y - this.height / 3 && x < this.x + (this.width * (2 / 3)) * viewScale && y < this.y + (this.height - this.height / 3) * viewScale);
    }
}

class Item extends WorldActor {
    level: number;
    constructor(options: IActorOptions) {
        super(options)
        this.width = 16;
        this.height = 16;

        this.level = options.level || 1;
    }

    get xOffset() {
        return this.width / 2 + (this.gridY % 2 == 0 ? this.width : 0);
    }

    get yOffset() {
        return -this.height / 2;
    }

    get draggable() {
        return (tileGrid[this.gridX][this.gridY].tile.type == 'grass');
    }

    draw(ctx, cam) {
        if (tileGrid[this.gridX][this.gridY].tile.type == 'grass') return super.draw(ctx, cam);
        return false;
    }

    getConnectedItemsOfSameTypeAndLevel() {
        let connected = [];
        if (this.gridY % 2) {
            connected.push(tileGrid[this.gridX - 1][this.gridY - 1].contents,
                tileGrid[this.gridX + 0][this.gridY - 1].contents,
                tileGrid[this.gridX + 0][this.gridY + 1].contents,
                tileGrid[this.gridX - 1][this.gridY + 1].contents)
        } else {
            connected.push(tileGrid[this.gridX - 0][this.gridY - 1].contents,
                tileGrid[this.gridX + 1][this.gridY - 1].contents,
                tileGrid[this.gridX + 1][this.gridY + 1].contents,
                tileGrid[this.gridX - 0][this.gridY + 1].contents)
        }

        return connected.filter(item => item && item.type == this.type && item.level == this.level);
    }

    complete() {
        console.log('ding');
        // Use drop table here
    }

    merge(merger) {

        // check around self for other items of same type
        // build list of connected items of same type
        let connectedItems: Set<Item> = new Set;

        let newLevel = this.level + 1;

        connectedItems.add(merger);

        this.getConnectedItemsOfSameTypeAndLevel().forEach(item => connectedItems.add(item));

        let depth = 10;

        for (let i = 0; i < depth; i++) {
            for (let item of connectedItems) {
                // then check around that item
                item.getConnectedItemsOfSameTypeAndLevel().forEach(item => connectedItems.add(item));
            }
        }
        connectedItems.add(this);


        if (connectedItems.size < 3) return false;

        let numUpgraded = 0;
        let used = 0;


        // group list into 5s
        // merge each group of 5 until list size < 5
        // for each 5 create two levelled up versions
        // remove merged
        if (connectedItems.size >= 5) {
            numUpgraded = Math.floor(connectedItems.size / 5) * 2;
            used = Math.floor(connectedItems.size - connectedItems.size % 5);
        }

        // group into 3s
        // merge 3s
        // for each 3 create one levelled up version
        // remove merged 3s
        if (connectedItems.size % 5 >= 3) {
            numUpgraded++;
            used += 3;
        }

        let leftover = connectedItems.size - used;
        console.log('upgraded:', numUpgraded)
        console.log('leftover:', leftover)
        // done

        let i = 0;
        console.log(connectedItems);
        for (let item of connectedItems) {
            tileGrid[item.gridX][item.gridY].contents = null;
            if (i < numUpgraded) {
                if (newLevel > itemManifest[item.type].maxLevel) {
                    item.complete();
                } else {
                    tileGrid[item.gridX][item.gridY].contents = new Item({
                        gridPosition: { gridX: item.gridX, gridY: item.gridY },
                        layer: item.layer,
                        sprite: sprites[`${item.type}-${newLevel}`],
                        type: item.type,
                        level: newLevel
                    })
                }
            } else if (i < numUpgraded + leftover) {
                tileGrid[item.gridX][item.gridY].contents = new Item({
                    gridPosition: { gridX: item.gridX, gridY: item.gridY },
                    layer: item.layer,
                    sprite: sprites[`${item.type}-${item.level}`],
                    type: item.type,
                    level: item.level
                })
            }

            i++
        }

        console.log(connectedItems);

        return true;
    }
}

class Camera {
    x: number = 0;
    y: number = 0;
    viewWidth: number;
    viewHeight: number;

    hBounds: number;
    vBounds: number;

    xOffset = 32 * viewScale;
    yOffset = 48 * viewScale;

    constructor() {
        this.resized();
    }

    resized() {
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

    // inView(actor: WorldActor) {
    //     return (actor.x + this.xOffset > this.x && actor.x < this.x + this.viewWidth
    //         && actor.y + this.yOffset > this.y && actor.y < this.y + this.viewHeight);
    // }
}

let camera: Camera;

let sprites: { [x: string]: Sprite } = {};

interface IGridTile {
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

    sprites.fog = new Sprite('./img/tiles/fog.png', 32, 48);
    loadPromises.push(sprites.fog.ready);

    for (let i = 1; i <= 5; i++) {
        sprites[`shit-${i}`] = new Sprite(`./img/items/shit-${i}.png`);
        loadPromises.push(sprites[`shit-${i}`].ready);
    }

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
                contents: null,
                tile: new Tile({
                    gridPosition: { gridX: i, gridY: j },
                    layer: 0,
                    sprite: sprites.water,
                    type: 'water'
                })
            }
        }
    }

    let waterBorder = 1;

    let seed = Math.floor(Math.random() * 1234567);

    console.log(seed);

    const noiseGen = makeNoise3D(seed);

    for (let i = waterBorder; i < worldWidth - waterBorder; i++) {
        for (let j = waterBorder * 2; j < worldHeight - waterBorder * 4; j++) {
            let layer = 1;

            const noiseScale = 20;

            let itemSize = Math.floor(1 + Math.random() * 5);

            if (noiseGen(i / noiseScale, j / noiseScale, 100) > 0) {
                let tile;

                if (i < worldWidth / 2 && j < worldHeight / 2) {
                    tile = new Tile({
                        gridPosition: { gridX: i, gridY: j },
                        layer,
                        sprite: sprites.grass,
                        droppable: true,
                        type: 'grass',
                    })
                } else {
                    tile = new Tile({
                        gridPosition: { gridX: i, gridY: j },
                        layer,
                        sprite: sprites.fog,
                        droppable: false,
                        type: 'fog',
                    })
                }
                tileGrid[i][j] = {
                    tile,
                    contents: Math.random() < 0.1 ? new Item({
                        gridPosition: { gridX: i, gridY: j },
                        layer: layer + 10,
                        sprite: sprites[`shit-${itemSize}`],
                        type: `shit`,
                        level: itemSize
                    }) : null,
                }
            }
        }
    }

    startLoop();
}

const flattenArray = array2D => {
    let flatArray = [];

    array2D.forEach(row => row.forEach(gridSq => {
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

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    let flatArray = flattenArray(tileGrid);


    flatArray.sort((a, b) => a.y - b.y);

    flatArray.sort((a, b) => a.layer - b.layer);


    for (let actor of flatArray) {
        (<WorldActor>actor).draw(ctx, camera);
    }

    handleInput();

    //DEBUG
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, cnv.height - 20, cnv.width, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('FPS: ' + avgFps.toFixed(2), 10, cnv.height - 4);
    ctx.fillText('rev' + version, cnv.width - 60, cnv.height - 4);

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

const itemTouchListeners = (x, y, targetBB) => {
    for (let actor of flattenArray(tileGrid)) {
        actor = actor as WorldActor;

        if (actor.draggable && actor.collides(x, y)) {
            // item dragging listeners
            let dragged: Item = actor;

            x -= (dragged.width / 2) * viewScale;
            y -= (dragged.height / 2) * viewScale;

            const moveHandler = e => {
                e.preventDefault();

                x = e.touches[0].pageX - targetBB.x + camera.x;
                y = e.touches[0].pageY - targetBB.y + camera.y;

                if (x > cnv.width * 0.9 + camera.x) camera.move(5, 0);
                if (x < cnv.width * 0.1 + camera.x) camera.move(-5, 0);
                if (y > cnv.height * 0.9 + camera.y) camera.move(0, 5);
                if (y < cnv.height * 0.1 + camera.y) camera.move(0, -5);


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
                e.preventDefault();

                for (let tile of flattenArray(tileGrid)) {
                    tile = tile as Tile;
                    if (!tile.droppable) continue;

                    tile.draggedOver = false;

                    if (tile.collides(x, y)) {
                        if (tile.contents && tile.contents.type !== dragged.type) continue;

                        const moveItem = () => {
                            tileGrid[tile.gridX][tile.gridY].contents = dragged;
                            tileGrid[dragged.gridX][dragged.gridY].contents = null;

                            // set dragged position to dropped grid
                            dragged.gridX = tile.gridX;
                            dragged.gridY = tile.gridY;
                        }

                        if (tile.contents && tile.contents.type == dragged.type) {
                            if (dragged.merge(tile.contents)) {
                                console.log('good merge');
                                // moveItem();
                            } else {
                                console.log('bad merge');
                            }
                        } else {
                            moveItem();
                        }
                        break;
                    }
                }

                dragged._x = false;
                dragged._y = false;

                cnv.removeEventListener('touchmove', moveHandler);
                cnv.removeEventListener('touchend', endHandler);
            }

            cnv.addEventListener('touchmove', moveHandler);
            cnv.addEventListener('touchend', endHandler);

            return true;
        }
    }

    return false;
}

let cameraTouchListeners = (x, y, targetBB, startX, startY) => {
    // camera move listeners
    const cameraMoveHandler = e => {
        e.preventDefault();

        x = e.touches[0].pageX - targetBB.x + camera.x;
        y = e.touches[0].pageY - targetBB.y + camera.y;

        camera.move(startX - x, startY - y);

    }

    const cameraEndHandler = e => {
        e.preventDefault();

        cnv.removeEventListener('touchmove', cameraMoveHandler);
        cnv.removeEventListener('touchend', cameraEndHandler);
    }

    cnv.addEventListener('touchmove', cameraMoveHandler);
    cnv.addEventListener('touchend', cameraEndHandler);
}

cnv.addEventListener('touchstart', e => {
    e.preventDefault();

    let targetBB = (<HTMLElement>e.target).getBoundingClientRect();
    let startX = e.touches[0].pageX - targetBB.x + camera.x;
    let startY = e.touches[0].pageY - targetBB.y + camera.y;

    let x = startX;
    let y = startY;

    if (itemTouchListeners(x, y, targetBB)) return;

    let interactableObjectPressed = false;

    // TODO Loop through array again looking for interactable objects (sorted by layer)

    if (!interactableObjectPressed) {
        cameraTouchListeners(x, y, targetBB, startX, startY);
    }
})