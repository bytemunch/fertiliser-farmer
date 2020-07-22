import { makeNoise3D } from '../lib/osn.js';
import { Sprite } from './class/Sprite.js';
import { WorldActor } from './class/WorldActor.js';
import { Tile } from './class/Tile.js';
import { Item } from './class/Item.js';
import { Camera } from './class/Camera.js';
import { IUIOptions, UIElement, Bank, CoinDisplay, XPDisplay, XPBall, PlayButton, DrawnSprite, InventoryButton } from './class/UIElements.js';

let DEBUG = {
    boundingBoxes: false,
    showInfo: true
}

let version;

(async () => {
    version = await (await fetch('./version')).text();
})();

export let cnv = document.createElement('canvas');
cnv.style.imageRendering = 'pixelated';
let ctx = cnv.getContext('2d');
ctx.imageSmoothingEnabled = false;

window.addEventListener('resize', () => {
    cnv.height = window.innerHeight;
    cnv.width = window.innerWidth;

    camera.resized();

    UIElements.forEach(el => el.updatePosition())
})

let contentDiv: HTMLDivElement;

let loop = false;

let state = '';

interface IInventoryContents {
    [itemTypeAndLevel: string]: number
}

class Inventory {
    contents: IInventoryContents = {};

    addItem(item: Item) {
        this.addByTypeAndLevel(item.type, item.level);
    }

    removeItem(item: Item) {
        this.removeByTypeAndLevel(item.type, item.level);
    }

    addByTypeAndLevel(type, level) {
        let typeStr = type + '-' + level;
        if (!this.contents[typeStr]) this.contents[typeStr] = 0;
        this.contents[typeStr]++;

        console.log(this.contents);
    }

    removeByTypeAndLevel(type, level) {
        let typeStr = type + '-' + level;
        if (!this.contents[typeStr]) this.contents[typeStr] = 0;
        this.contents[typeStr]++;
    }

    toJSON() {
        return this.contents;
    }
}

export let inventory = new Inventory();

interface IDropOptions extends IUIOptions {
    targetPos: number[];
    value: number;
}

export class Drop extends UIElement {
    age = 0;
    directionVector: number[];

    targetDirection: number[];
    value;

    mag = 0;

    constructor(opts: IDropOptions) {
        super(opts);

        this.width = 16;
        this.height = 16;

        this.directionVector = [1 - Math.random() * 2, -1 - Math.random()];

        let dX = opts.targetPos[0] - this.left;
        let dY = opts.targetPos[1] - this.top;

        this.mag = Math.sqrt(dX ** 2 + dY ** 2)

        this.targetDirection = [
            dX / this.mag,
            dY / this.mag
        ]
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.age++;
        ctx.drawImage(this.img, this.left, this.top, this.img.width, this.img.height);
        if (this.age < 10) {
            this.top += this.directionVector[1];
        } else if (this.age < 20) {
            this.top -= this.directionVector[1];
        }

        if (this.age < 20) {
            this.left += this.directionVector[0];
        } else {
            this.left += this.targetDirection[0] * (this.mag / 3) * fElapsedTime;
            this.top += this.targetDirection[1] * (this.mag / 3) * fElapsedTime;
        }

        if (this.left > cnv.width || this.top > cnv.height || this.left < 0 || this.top < 0) this.destroy();
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

    destroy() {
        super.destroy();
        inventory.addByTypeAndLevel(this.type, this.level);
    }
}

export let worldWidth = 50;

export let worldHeight = worldWidth * 2;

export let viewScale = 1;

export let dropManifest = {
    coin: Coin,
    poop: Item,
    xp: XPDrop
}

export let itemManifest = {
    'poop': {
        maxLevel: 5,
        dropTable: {
            coin: [3, 5],
            [`poop-1`]: [1, 3],
            xp: [50, 50]
        }
    }
}

export const getXpBoundaryForLevel = level => {
    return 100 * level * (level / 2);
}

export const xpToCurrentLevel = xp => {
    return Math.floor(Math.sqrt(2 * xp / 100));
}

export const randInRange = (min, max) => {
    return Math.floor(min + (Math.random() * (max - min + 1)));
}

export let coins = 0;
export const addCoins = n => {
    coins += n;
    saveGame();
}
export let xp = 0;

export const addXp = n => {
    xp += n;
    saveGame();
}

export interface IActorOptions {
    gridPosition: { gridX: number, gridY: number },
    sprite: Sprite,
    layer: number,
    droppable?: boolean,
    draggable?: boolean,
    type: string,
    level?: number
}

export let camera: Camera;

export let sprites: { [x: string]: Sprite } = {};

interface IGridTile {
    tile: Tile,
    contents: Item
}

export let tileGrid: IGridTile[][] = [];



export let UIElements: any[] = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('YEET');
    loaded();
})

const loadSprites = () => {
    let loadPromises: Promise<any>[] = [];

    sprites.grass = new Sprite('./img/2x/tiles/grass.png', 64, 96);
    sprites.grass.frameRate = 3;
    loadPromises.push(sprites.grass.ready);

    sprites.water = new Sprite('./img/2x/tiles/water.png', 64, 32);
    sprites.water.frameRate = 3;
    loadPromises.push(sprites.water.ready);

    sprites.fog = new Sprite('./img/2x/tiles/fog.png', 64, 96);
    loadPromises.push(sprites.fog.ready);

    for (let i = 1; i <= 5; i++) {
        sprites[`poop-${i}`] = new Sprite(`./img/2x/items/poop-${i}.png`);
        loadPromises.push(sprites[`poop-${i}`].ready);
    }

    sprites.bank = new Sprite(`./img/2x/graphics/bank.png`, 64, 64);
    loadPromises.push(sprites.bank.ready);

    sprites.inventory = new Sprite(`./img/2x/graphics/inventory.png`, 64, 64);
    loadPromises.push(sprites.inventory.ready);

    sprites.coin = new Sprite('./img/2x/items/coin.png', 16, 16);
    sprites.coin.frameRate = 20;
    loadPromises.push(sprites.coin.ready);

    sprites.xp = new Sprite('./img/2x/items/xp.png', 16, 16);
    sprites.xp.frameRate = 20;
    loadPromises.push(sprites.xp.ready);

    sprites.xporb = new Sprite('./img/2x/graphics/xporb.png', 64, 64);
    sprites.xporb.animate = 'stepped';
    loadPromises.push(sprites.xporb.ready);

    sprites.playButton = new Sprite('./img/2x/graphics/btn_play.png', 182, 112);
    loadPromises.push(sprites.playButton.ready);

    sprites.title = new Sprite('./img/2x/graphics/title.png', 320, 184);
    loadPromises.push(sprites.title.ready);

    return Promise.allSettled(loadPromises);
}

const startLoop = () => {
    loop = true;
    requestAnimationFrame(rAFLoop);
}

let saving;

const saveGame = () => {

    clearTimeout(saving);

    saving = setTimeout(()=>{
        let saveData = [];
        for (let i = 0; i < tileGrid.length; i++) {
            saveData[i] = [];
            for (let j = 0; j < tileGrid[i].length; j++) {
                saveData[i][j] = {
                    contents: tileGrid[i][j].contents ? tileGrid[i][j].contents.toJSON() : null,
                    tile: tileGrid[i][j].tile.toJSON()
                }
            }
        }
    
        let fullState = {
            coins: coins,
            xp: xp,
            tileGrid: saveData,
            inventory: inventory.toJSON(),
            expandableSpaceHere: true
        }
    
        localStorage.setItem('save', JSON.stringify(fullState));
    }, 1000);
}


const loadGame = () => {
    let saveData = JSON.parse(localStorage.getItem('save'));

    coins = saveData.coins;
    xp = saveData.xp;
    inventory.contents = saveData.inventory || {};

    for (let i = 0; i < saveData.tileGrid.length; i++) {
        tileGrid[i] = [];
        for (let j = 0; j < saveData.tileGrid[i].length; j++) {
            tileGrid[i][j] = {
                contents: saveData.tileGrid[i][j].contents ? new Item({}, saveData.tileGrid[i][j].contents) : null,
                tile: new Tile({}, saveData.tileGrid[i][j].tile)
            }
        }
    }
}

const addGameUI = () => {
    UIElements = [];

    UIElements.push(new Bank({
        right: 0,
        width: 64,
        height: 64,
        layer: 2,
        type: 'bank',
        sprite: sprites.bank
    }))

    UIElements.push(new InventoryButton({
        centerX: true,
        width: 64,
        height: 64,
        layer: 2,
        type: 'inventory',
        sprite: sprites.inventory
    }))

    UIElements.push(new CoinDisplay({
        right: 64,
        width: 120,
        height: 20,
        layer: 2,
        type: 'coindisplay',
        sprite: sprites.coin
    }))

    UIElements.push(new XPDisplay({
        left: 64,
        width: 120,
        height: 20,
        layer: 2,
        type: 'xpdisplay',
        sprite: sprites.xp
    }))

    UIElements.push(new XPBall({
        left: 0,
        width: 64,
        height: 64,
        layer: 2,
        type: 'xporb',
        sprite: sprites.xporb
    }))
}

export const startGame = () => {
    if (localStorage.getItem('save') == null) {
        createNewGame();
    } else {
        loadGame();
    }

    addGameUI();
}

const createMainMenu = () => {
    state = 'mainmenu';
    UIElements = [];
    console.log('Main menu!', cnv.width, cnv.height);

    UIElements.push(new PlayButton({
        height: 48*2,
        width: 78*2,
        centerX: true,
        bottom: cnv.height * 0.05,
        layer: 10,
        sprite: sprites.playButton,
        type: 'play'
    }))

    UIElements.push(new DrawnSprite({
        height: 92*2,
        width: 160*2,
        centerX: true,
        top: cnv.height * 0.05,
        layer: 9,
        sprite: sprites.title,
        type: 'title'
    }))
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
    }

    createMainMenu();
    // startGame();

    startLoop();
}


// new game
const createNewGame = () => {
    coins = 0;
    xp = 0;
    inventory.contents = {};

    for (let i = 0; i < worldWidth; i++) {
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

    const noiseGen = makeNoise3D(seed);

    for (let i = waterBorder; i < worldWidth - waterBorder; i++) {
        for (let j = waterBorder * 2; j < worldHeight - waterBorder * 4; j++) {
            let layer = 1;

            const noiseScale = 20;

            let itemSize = 5;//Math.floor(1 + Math.random() * 5);

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
                        sprite: sprites[`poop-${itemSize}`],
                        type: `poop`,
                        level: itemSize
                    }) : null,
                }
            }
        }
    }

    saveGame();
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
let fElapsedTime = 0;

let frameCount = 0;

let prevFPSs = [];

let avgFps;

const avg = (arr) => {
    let rt = 0;
    for (let a of arr) {
        rt += a;
    }

    return rt / arr.length;
}

const drawGame = () => {
    let flatArray = flattenArray(tileGrid);

    flatArray.sort((a, b) => a.y - b.y);

    flatArray.sort((a, b) => a.layer - b.layer);

    for (let actor of flatArray) {
        (<WorldActor>actor).draw(ctx, camera);
    }

    // UI
    UIElements.sort((a, b) => a.layer - b.layer);
    for (let el of UIElements) {
        el.draw(ctx);
    }
}

const drawDebug = () => {
    //DEBUG
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, cnv.height - 20, cnv.width, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('FPS: ' + avgFps.toFixed(2), 10, cnv.height - 4);
    ctx.fillText('rev' + version, cnv.width - 60, cnv.height - 4);
}

const rAFLoop = (t: DOMHighResTimeStamp) => {
    ctx.translate(-0.5, -0.5);
    frameTime = t - lastT;
    fps = 1000 / frameTime;
    lastT = t;
    fElapsedTime = frameTime / 100;

    prevFPSs.push(fps);

    if (prevFPSs.length > 30) prevFPSs.shift();

    avgFps = avg(prevFPSs);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    switch (state) {
        case 'playing':
            break;


    }
    drawGame();

    handleInput();

    if (DEBUG.showInfo) drawDebug();


    ctx.resetTransform();

    frameCount++;

    if (loop) requestAnimationFrame(rAFLoop);
}

let keysHeld: { [key: string]: boolean } = {};

document.addEventListener('keydown', e => {
    keysHeld[e.key.toLowerCase()] = true;

    if (e.key == 'n') {
        createNewGame();
    }
})

document.addEventListener('keyup', e => {
    keysHeld[e.key.toLowerCase()] = false;
})

// do this in-class?
const handleInput = () => {
    let moveSpeed = 70 * fElapsedTime;
    if (keysHeld['shift']) moveSpeed = 140 * fElapsedTime;
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
                        if (tile.contents && tile.contents.type !== dragged.type && tile.contents.level !== dragged.level) continue;

                        const moveItem = () => {
                            tileGrid[tile.gridX][tile.gridY].contents = dragged;
                            tileGrid[dragged.gridX][dragged.gridY].contents = null;

                            // set dragged position to dropped grid
                            dragged.gridX = tile.gridX;
                            dragged.gridY = tile.gridY;
                        }

                        if (tile.contents && tile.contents.type == dragged.type) {
                            if (tile.contents.level == dragged.level && dragged.merge(tile.contents)) {
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

                saveGame();
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

const uiTouchListeners = (x, y) => {
    UIElements.sort((a, b) => b.layer - a.layer);
    for (let el of UIElements) {
        // if (!el.interactable) continue;

        if (el.collidePoint(x, y)) {
            el.act();
            return true;
        }
    }
    return false;
}

cnv.addEventListener('touchstart', e => {
    e.preventDefault();

    let targetBB = (<HTMLElement>e.target).getBoundingClientRect();
    let startX = e.touches[0].pageX - targetBB.x + camera.x;
    let startY = e.touches[0].pageY - targetBB.y + camera.y;

    let x = startX;
    let y = startY;

    if (uiTouchListeners(e.touches[0].pageX - targetBB.x, e.touches[0].pageY - targetBB.y)) return;

    if (itemTouchListeners(x, y, targetBB)) return;

    let interactableObjectPressed = false;

    // TODO Loop through array again looking for interactable objects (sorted by layer)

    if (!interactableObjectPressed) {
        cameraTouchListeners(x, y, targetBB, startX, startY);
    }
})