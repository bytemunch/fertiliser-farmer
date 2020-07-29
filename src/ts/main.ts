import { makeNoise3D } from '../lib/osn.js';
import { Sprite } from './class/Sprite.js';
import { WorldActor } from './class/WorldActor.js';
import { Tile, newTileFromJSON } from './class/Tile.js';
import { Item, newItemFromJSON } from './class/Item.js';
import { Camera } from './class/Camera.js';
import { IUIOptions, UIElement, Bank, CoinDisplay, XPDisplay, XPBall, PlayButton, DrawnSprite, InventoryButton, LevelUpScreen, ToolSelector, MenuButton } from './class/UIElements.js';
import { Animal, Chicken, newAnimalFromJSON } from './class/Animal.js';

export let DEBUG = {
    boundingBoxes: true,
    showInfo: true,
    editVars: true
}

// TODO use this
export const LAYERS = {
    BG: 0,
    FG: 100,
    ITEM: 200,
    UI: 500
}

let version;

(async () => {
    version = await (await fetch('./version')).text();
})();

export let cnv = document.createElement('canvas');
cnv.style.imageRendering = 'pixelated';
let ctx = cnv.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

window.addEventListener('resize', () => {
    cnv.height = window.innerHeight;
    cnv.width = window.innerWidth;
    targetBB = cnv.getBoundingClientRect();

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
    contents: IInventoryContents = {
    };

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
    }

    removeByTypeAndLevel(type, level) {
        let typeStr = type + '-' + level;
        if (!this.contents[typeStr]) this.contents[typeStr] = 0;
        this.contents[typeStr]--;
        if (this.contents[typeStr] <= 0) delete this.contents[typeStr];
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

export let extraActors = []

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
        this.age += fElapsedTime * 5;
        ctx.drawImage(this.img, this.left, this.top, this.img.width, this.img.height);
        if (this.age < 10) {
            this.top += this.directionVector[1] * fElapsedTime * 5;
        } else if (this.age < 20) {
            this.top -= this.directionVector[1] * fElapsedTime * 5;
        }

        if (this.age < 20) {
            this.left += this.directionVector[0] * fElapsedTime * 5;
        } else {
            this.left += this.targetDirection[0] * (this.mag / 3) * fElapsedTime;
            this.top += this.targetDirection[1] * (this.mag / 3) * fElapsedTime;
        }

        if (this.left > cnv.width || this.top > cnv.height || this.left < 0 || this.top < 0) this.removeNextDraw = true;
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
    },
    'gold_poop': {
        maxLevel: 5,
        dropTable: {
            coin: [30, 50],
            [`gold_poop-1`]: [1, 3],
            xp: [150, 150]
        }
    },
}

export let levelManifest = {
    1: {
        rewards: {
            'antifog': 10
        }
    }
}

export const xpBoundaryForLevel = level => {
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
    let prevLvl = xpToCurrentLevel(xp);
    xp += n;
    let nextLvl = xpToCurrentLevel(xp);

    if (prevLvl < nextLvl) {
        levelUp();
    }
    saveGame();
}

class Tool {
    img: Sprite;
    uses: number = 0;
    type: string;

    act(x, y) {
        if (this.uses <= 0) {
            this.uses = 0;
            tool = 'hand';
            return false;
        }
        this.uses--;

        saveGame();
        return true;
    }

    addUses(n) {
        this.uses += n;
        console.log('use added', n);
    }
}

class HandTool extends Tool {
    type = 'hand';
    uses = Infinity;

    act(x, y) {
        if (!super.act(x, y)) return false;
        if (animalTouchListeners(x, y)) return true;
        if (itemTouchListeners(x, y)) return true;
        return false;
    }
}

class AntiFog extends Tool {
    type = 'antifog';
    uses = 0;

    act(x, y) {
        // decrement uses
        if (!super.act(x, y)) return false;
        // if fog is at x,y
        for (let tile of flattenArray(tileGrid)) {
            // remove fog
            if (tile.baseClass != 'tile') continue;
            if (tile.type != 'fog') continue;
            if (tile.collides(x, y)) {
                tileGrid[tile.gridX][tile.gridY].tile = new Tile({
                    gridPosition: { gridX: tile.gridX, gridY: tile.gridY },
                    layer: tile.layer,
                    sprite: sprites.grass,
                    droppable: true,
                    type: 'grass',
                });
                return true;
            }
        }

        // re-add use as we havent actually cleared
        this.addUses(1);

        return false;
    }
}

export let tools = {
    antifog: new AntiFog,
    hand: new HandTool,
}

export let tool = 'hand';

export const changeTool = (toolName) => {
    tool = toolName;
}

export const nextTool = () => {
    let tIDs = Object.keys(tools);
    let count = tIDs.length;
    let cIdx = tIDs.indexOf(tool);

    if (cIdx >= count - 1) {
        tool = tIDs[0];
    } else {
        tool = tIDs[cIdx + 1];
    }
}

const levelUp = () => {
    let lvl = xpToCurrentLevel(xp);

    if (!levelManifest[lvl]) {
        console.error('Rewards not implemented for level ' + lvl);
    }
    // create reward screen
    UIElements.push(new LevelUpScreen);
    // console.log('Reward screen not implemented!', levelManifest[lvl]);
}

if (DEBUG.editVars) {
    globalThis.addXp = addXp;
    globalThis.xpToCurrentLevel = xpToCurrentLevel;
    globalThis.addChickenAtPos = pos => {
        animals.push(new Chicken(pos));
    }
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
    loaded();
})

const loadSprites = () => {
    let loadPromises: Promise<any>[] = [];

    sprites.grass = new Sprite('./img/tiles/grass.png', 64, 96);
    sprites.grass.frameRate = 3;
    loadPromises.push(sprites.grass.ready);

    sprites.water = new Sprite('./img/tiles/water.png', 64, 32);
    sprites.water.frameRate = 3;
    loadPromises.push(sprites.water.ready);

    sprites.fog = new Sprite('./img/tiles/fog.png', 64, 96);
    loadPromises.push(sprites.fog.ready);


    for (let i in itemManifest) {
        for (let j = 1; j <= itemManifest[i].maxLevel; j++) {
            sprites[`${i}-${j}`] = new Sprite(`./img/items/${i}/${i}-${j}.png`);
            loadPromises.push(sprites[`${i}-${j}`].ready);
        }
    }

    sprites['animal-chicken'] = new Sprite('./img/animals/chicken.png', 32, 32);

    sprites.bank = new Sprite(`./img/graphics/bank.png`, 64, 64);
    loadPromises.push(sprites.bank.ready);

    sprites.tool_select = new Sprite(`./img/graphics/tool_select.png`, 64, 64);
    loadPromises.push(sprites.tool_select.ready);

    sprites.hand = new Sprite(`./img/graphics/hand.png`, 64, 64);
    loadPromises.push(sprites.hand.ready);

    sprites.antifog = new Sprite(`./img/graphics/antifog.png`, 64, 64);
    loadPromises.push(sprites.antifog.ready);

    sprites.inventory = new Sprite(`./img/graphics/inventory.png`, 64, 64);
    loadPromises.push(sprites.inventory.ready);

    sprites.coin = new Sprite('./img/items/coin.png', 16, 16);
    sprites.coin.frameRate = 20;
    loadPromises.push(sprites.coin.ready);

    sprites.xp = new Sprite('./img/items/xp.png', 16, 16);
    sprites.xp.frameRate = 20;
    loadPromises.push(sprites.xp.ready);

    sprites.xporb = new Sprite('./img/graphics/xporb.png', 64, 64);
    sprites.xporb.animate = 'stepped';
    loadPromises.push(sprites.xporb.ready);

    sprites.playButton = new Sprite('./img/graphics/btn_play.png', 182, 112);
    loadPromises.push(sprites.playButton.ready);

    sprites.menuButton = new Sprite('./img/graphics/btn_menu.png', 92, 60);
    loadPromises.push(sprites.menuButton.ready);

    sprites.title = new Sprite('./img/graphics/title.png', 320, 184);
    loadPromises.push(sprites.title.ready);

    sprites.close = new Sprite('./img/graphics/close.png', 32, 32);
    loadPromises.push(sprites.close.ready);

    return Promise.allSettled(loadPromises);
}

const startLoop = () => {
    loop = true;
    requestAnimationFrame(rAFLoop);
}

let saving;

export const saveGame = (force?) => {

    clearTimeout(saving);

    saving = setTimeout(() => {
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
            animals: animals,
            tools: tools,
            expandableSpaceHere: true
        }

        localStorage.setItem('save', JSON.stringify(fullState));
        console.info('Game saved!');
    }, force ? 0 : 1000);
}


const loadGame = () => {
    let saveData = JSON.parse(localStorage.getItem('save'));

    coins = saveData.coins;
    xp = saveData.xp;
    inventory.contents = saveData.inventory || {};
    tools.antifog.addUses(saveData.tools.antifog.uses);

    for (let animal of saveData.animals) {
        animals.push(newAnimalFromJSON(animal))
    }

    for (let i = 0; i < saveData.tileGrid.length; i++) {
        tileGrid[i] = [];
        for (let j = 0; j < saveData.tileGrid[i].length; j++) {
            tileGrid[i][j] = {
                contents: saveData.tileGrid[i][j].contents ? newItemFromJSON(saveData.tileGrid[i][j].contents) : null,
                tile: newTileFromJSON(saveData.tileGrid[i][j].tile)
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

    UIElements.push(new ToolSelector({
        left: 0,
        top: cnv.height - 64,
        width: 64,
        height: 64,
        layer: 2,
        type: 'tool_select',
        sprite: sprites.tool_select
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

    state = 'playing';
    //@ts-ignore
    window.location = '#' + state;
}

window.addEventListener('popstate', e => {
    if (state == location.hash.replace('#', '')) return;
    state = location.hash.replace('#', '');

    switch (state) {
        case 'playing':
            startGame();
            break;
        case 'mainmenu':
            createMainMenu();
            break;
        default:
            console.error('Hash not found!',state);
    }
})

const createMainMenu = () => {
    cleanup();
    state = 'mainmenu';
    //@ts-ignore
    window.location = '#' + state;

    UIElements.push(new PlayButton({
        height: 48 * 2,
        width: 78 * 2,
        centerX: true,
        bottom: cnv.height * 0.05,
        layer: 10,
        sprite: sprites.playButton,
        type: 'play'
    }))

    UIElements.push(new MenuButton({
        height: 60,
        width: 92,
        top: 10,
        right: 10,
        layer: 10,
        sprite: sprites.menuButton,
        type: 'menu'
    }))

    UIElements.push(new DrawnSprite({
        height: 92 * 2,
        width: 160 * 2,
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

const cleanup = () => {
    coins = 0;
    xp = 0;
    inventory = new Inventory;
    animals = [];
    tools = {
        antifog: new AntiFog,
        hand: new HandTool,
    };
    UIElements = [];
    
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
}


// new game
const createNewGame = () => {
    cleanup();

    let waterHBorder = 1;
    let waterVBorder = 6;

    let seed = Math.floor(Math.random() * 1234567);

    const noiseGen = makeNoise3D(seed);

    for (let i = waterHBorder; i < worldWidth - waterHBorder; i++) {
        for (let j = waterVBorder; j < worldHeight - waterVBorder; j++) {
            let layer = 1;

            const noiseScale = 20;

            let itemSize = 5;//Math.floor(1 + Math.random() * 5);

            let item = Math.random() > 0.5 ? 'poop' : 'gold_poop';

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
                        sprite: sprites[`${item}-${itemSize}`],
                        type: item,
                        level: itemSize
                    }) : null,
                }
            }
        }
    }

    saveGame();
}

export const flattenArray = array2D => {
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
export let fElapsedTime = 0;

export let frameCount = 0;

let prevFPSs = [];

let avgFps;

const avg = (arr) => {
    let rt = 0;
    for (let a of arr) {
        rt += a;
    }

    return rt / arr.length;
}

export let animals: Animal[] = [];

const drawGame = () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, cnv.width, cnv.height);

    let flatArray = flattenArray(tileGrid);

    flatArray = flatArray.concat(extraActors).concat(animals);

    flatArray.sort((a, b) => a.y - b.y);

    flatArray.sort((a, b) => a.layer - b.layer);

    let drawnObjs = 0;
    for (let actor of flatArray) {
        (<WorldActor>actor).update();
        if ((<WorldActor>actor).draw(ctx, camera)) drawnObjs++;
    }

    // UI
    UIElements.forEach(el => { if (el.removeNextDraw) el.destroy() });

    UIElements.sort((a, b) => a.layer - b.layer);
    for (let el of UIElements) {
        el.draw(ctx);
    }

    // if (frameCount % 100 == 0) console.log(flatArray.length, UIElements.length, drawnObjs + UIElements.length)
}

const drawDebug = () => {
    //DEBUG
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, cnv.height - 20, cnv.width, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('FPS: ' + avgFps.toFixed(2), 10, cnv.height - 4);
    ctx.fillText('rev' + version, cnv.width - 60, cnv.height - 4);
    ctx.fillText(`[${((camera.x + camera.viewWidth / 2) - 32).toPrecision(4)},${((camera.y + camera.viewHeight / 2) - 48).toPrecision(4)}]`, cnv.width / 2, cnv.height - 4);
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(cnv.width / 2, 0);
    ctx.lineTo(cnv.width / 2, cnv.height - 20);
    ctx.moveTo(0, cnv.height / 2);
    ctx.lineTo(cnv.width, cnv.height / 2);
    ctx.stroke();
    ctx.closePath();
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

    for (let s in sprites) {
        sprites[s].draw();
    }

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

export const pickup = (dragged, callback?) => {
    // item dragging listeners
    let x = 0;
    let y = 0;

    extraActors.push(dragged);

    const moveHandler = e => {
        e.preventDefault();

        if (dragged.gridX != -1 && dragged.gridY != -1) tileGrid[dragged.gridX][dragged.gridY].contents = null;

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
        let goodMove = false;

        for (let tile of flattenArray(tileGrid)) {
            tile = tile as Tile;
            if (!tile.droppable) continue;

            tile.draggedOver = false;

            if (tile.collides(x, y)) {
                if (tile.contents && (tile.contents.type !== dragged.type || tile.contents.level !== dragged.level)) continue;

                const moveItem = () => {
                    tileGrid[tile.gridX][tile.gridY].contents = dragged;

                    // set dragged position to dropped grid
                    dragged.gridX = tile.gridX;
                    dragged.gridY = tile.gridY;

                    goodMove = true;
                }

                if (tile.contents && tile.contents.type == dragged.type) {
                    if (tile.contents.level == dragged.level && dragged.merge(tile.contents)) {
                        goodMove = true;
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
        if (callback) callback(false);

        extraActors.splice(extraActors.indexOf(dragged), 1);

        if (callback) callback(goodMove);

        if (!goodMove) {
            if (dragged.gridX != -1 && dragged.gridY != -1) tileGrid[dragged.gridX][dragged.gridY].contents = dragged;
        }

        saveGame();
    }

    cnv.addEventListener('touchmove', moveHandler);
    cnv.addEventListener('touchend', endHandler);

    return true;
}

const itemTouchListeners = (x, y) => {
    for (let actor of flattenArray(tileGrid)) {
        actor = actor as WorldActor;

        if (actor.draggable && actor.collides(x, y)) {
            pickup(actor);
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
        if (el.collidePoint(x, y)) {
            if (!el.interactable) return true; // eat input
            el.act();
            return true;
        }
    }
    return false;
}

const animalTouchListeners = (x, y) => {
    console.log('Animal touch listeners not implemented!');
    return false;
}

let targetBB = cnv.getBoundingClientRect();

cnv.addEventListener('touchstart', e => {
    e.preventDefault();

    let startX = e.touches[0].pageX - targetBB.x + camera.x;
    let startY = e.touches[0].pageY - targetBB.y + camera.y;

    let x = startX;
    let y = startY;

    if (uiTouchListeners(e.touches[0].pageX - targetBB.x, e.touches[0].pageY - targetBB.y)) return;

    if (state == 'playing') {
        if (tools[tool].act(x, y)) return;
        cameraTouchListeners(x, y, targetBB, startX, startY);
    }

})