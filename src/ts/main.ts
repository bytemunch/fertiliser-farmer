import { makeNoise3D } from '../lib/osn.js';
import { Sprite } from './class/Sprite.js';
import { Tile, newTileFromJSON } from './class/Tile.js';
import { Item, newItemFromJSON } from './class/Item.js';
import { Camera } from './class/Camera.js';
import { UIElement, Bank, CoinDisplay, XPDisplay, XPBall, PlayButton, InventoryButton, LevelUpScreen, ToolSelector, MenuButton } from './class/UIElements.js';
import { Animal, Chicken, newAnimalFromJSON } from './class/Animal.js';
import { Inventory } from './class/Inventory.js';
import { Coin, XPDrop } from './class/Drop.js';
import { HandTool } from './class/HandTool.js';
import { AntiFog } from './class/AntiFog.js';

export let DEBUG = {
    boundingBoxes: false,
    showInfo: true,
    editVars: true
}

// br1 ================================= INIT ====================================

let version;

(async () => {
    version = await (await fetch('./version')).text();
})();

export let LAYERNUMBERS = {
    tile: 0,
    item: 1,
    animal: 1,
    ui: 2,
    debug: 3
}

const TILE_FRAMERATE = 3;

export let layers = [];
export let extraActors = [];

let numLayers = 4;

// Initialise canvases
for (let i = 0; i < numLayers; i++) {
    let newCnv = document.createElement('canvas');
    let opts = {};
    if (i == 0) opts = { alpha: false };
    layers.push({ cnv: newCnv, ctx: newCnv.getContext('2d', opts) });
}

window.addEventListener('resize', () => {
    let dpi = devicePixelRatio;
    targetBB = contentDiv.getBoundingClientRect();

    for (let c of layers) {
        c.cnv.height = Math.floor(targetBB.height * dpi);
        c.cnv.width = Math.floor(targetBB.width * dpi);
    }

    camera.resized();

    UIElements.forEach(el => el.updatePosition())
})

let contentDiv: HTMLDivElement;

let loop = false;

let state = '';

export let inventory = new Inventory();

export let worldWidth = 50;

export let worldHeight = worldWidth * 2;

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

export let camera: Camera;

export let sprites: { [x: string]: Sprite } = {};

interface IGridTile {
    tile: Tile,
    contents: Item
}

export let tileGrid: IGridTile[][] = [];

export let UIElements: any[] = [];

export let animals: Animal[] = [];


document.addEventListener('DOMContentLoaded', () => {
    loaded();

    if (DEBUG.editVars) {
        globalThis.addXp = addXp;
        globalThis.xpToCurrentLevel = xpToCurrentLevel;
        globalThis.addChickenAtPos = pos => {
            animals.push(new Chicken(pos));
        }
        globalThis.camera = camera;
    }
})

const loadSprites = () => {
    let loadPromises: Promise<any>[] = [];

    sprites.grass = new Sprite('./img/tiles/grass.png', 64, 96);
    loadPromises.push(sprites.grass.ready);

    sprites.water = new Sprite('./img/tiles/water.png', 64, 32);
    sprites.water.frameRate = TILE_FRAMERATE;
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

    sprites.clearButton = new Sprite('./img/graphics/btn_clear.png', 92, 60);
    loadPromises.push(sprites.clearButton.ready);

    sprites.clearButtonInactive = new Sprite('./img/graphics/btn_clear_inactive.png', 92, 60);
    loadPromises.push(sprites.clearButtonInactive.ready);

    sprites.title = new Sprite('./img/graphics/title.png', 320, 184);
    loadPromises.push(sprites.title.ready);

    sprites.close = new Sprite('./img/graphics/close.png', 32, 32);
    loadPromises.push(sprites.close.ready);

    return Promise.allSettled(loadPromises);
}

// br2 ========================== SAVELOAD =================================


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
    cleanupArrays();

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

// br3 ========================== FLOW =================================

const startLoop = () => {
    loop = true;
    requestAnimationFrame(mainLoop);
    requestAnimationFrame(drawTiles);
    requestAnimationFrame(drawItems);
    requestAnimationFrame(updateItems);
    requestAnimationFrame(updateTiles);
}

const addGameUI = () => {
    UIElements = [];

    UIElements.push(new Bank({
        right: 0,
        width: 64,
        height: 64,
        type: 'bank',
        sprite: sprites.bank
    }))

    UIElements.push(new ToolSelector({
        left: 0,
        top: layers[0].cnv.height - 64,
        width: 64,
        height: 64,
        type: 'tool_select',
        sprite: sprites.tool_select
    }))

    UIElements.push(new InventoryButton({
        centerX: true,
        width: 64,
        height: 64,
        type: 'inventory',
        sprite: sprites.inventory
    }))

    UIElements.push(new CoinDisplay({
        right: 64,
        width: 120,
        height: 20,
        type: 'coindisplay',
        sprite: sprites.coin
    }))

    UIElements.push(new XPDisplay({
        left: 64,
        width: 120,
        height: 20,
        type: 'xpdisplay',
        sprite: sprites.xp
    }))

    UIElements.push(new XPBall({
        left: 0,
        width: 64,
        height: 64,
        type: 'xporb',
        sprite: sprites.xporb
    }))
}

export const startGame = () => {
    clearLayer('ui');
    if (localStorage.getItem('save') == null) {
        createNewGame();
    } else {
        loadGame();
    }

    addGameUI();

    state = 'playing';
    //@ts-ignore yes typesctipt I can set the location directly fuck offffffff
    window.location = '#' + state;
}

window.addEventListener('popstate', () => {
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
            console.error('Hash not found!', state);
    }
})

const createMainMenu = () => {
    cleanupArrays();
    clearLayer('ui');
    state = 'mainmenu';
    //@ts-ignore yes typesctipt I can set the location directly fuck offffffff
    window.location = '#' + state;

    UIElements.push(new PlayButton({
        height: 48 * 2,
        width: 78 * 2,
        centerX: true,
        bottom: layers[0].cnv.height * 0.05,
        sprite: sprites.playButton,
        type: 'play'
    }))

    UIElements.push(new MenuButton({
        height: 60,
        width: 92,
        top: 10,
        right: 10,
        sprite: sprites.menuButton,
        type: 'menu'
    }))

    UIElements.push(new UIElement({
        height: 92 * 2,
        width: 160 * 2,
        centerX: true,
        top: layers[0].cnv.height * 0.05,
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

    for (let c of layers) {
        c.cnv.width = gameW;
        c.cnv.height = gameH;
    }

    camera = new Camera;

    for (let c of layers) {
        contentDiv.appendChild(c.cnv);
    }

    await loadSprites();
    // start making tiles here

    // initialize array
    for (let i = 0; i < worldWidth; i++) {
        tileGrid[i] = [];
    }

    contentDiv.addEventListener('touchstart', touched);

    createMainMenu();

    startLoop();
}

const cleanupArrays = () => {
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
                    sprite: sprites.water,
                    type: 'water'
                })
            }
        }
    }
}


// new game
const createNewGame = () => {
    cleanupArrays();

    let waterHBorder = 1;
    let waterVBorder = 6;

    let seed = Math.floor(Math.random() * 1234567);

    const noiseGen = makeNoise3D(seed);

    for (let i = waterHBorder; i < worldWidth - waterHBorder; i++) {
        for (let j = waterVBorder; j < worldHeight - waterVBorder; j++) {
            const noiseScale = 20;

            let itemSize = 5;//Math.floor(1 + Math.random() * 5);

            let item = Math.random() > 0.5 ? 'poop' : 'gold_poop';

            if (noiseGen(i / noiseScale, j / noiseScale, 100) > 0) {
                let tile;

                if (i < worldWidth / 2 && j < worldHeight / 2) {
                    tile = new Tile({
                        gridPosition: { gridX: i, gridY: j },
                        sprite: sprites.grass,
                        droppable: true,
                        type: 'grass',
                    })
                } else {
                    tile = new Tile({
                        gridPosition: { gridX: i, gridY: j },
                        sprite: sprites.fog,
                        droppable: false,
                        type: 'fog',
                    })
                }
                tileGrid[i][j] = {
                    tile,
                    contents: Math.random() < 0.1 ? new Item({
                        gridPosition: { gridX: i, gridY: j },
                        sprite: sprites[`${item}-${itemSize}`],
                        type: item,
                        level: itemSize
                    }) : null,
                }
            }
        }
    }

    saveGame(true);
}

// br4 ================= DRAWING ================================

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

let drawnObjs = 0;

export const clearLayer = l => {
    if (typeof l == 'string') l = LAYERNUMBERS[l];
    layers[l].ctx.clearRect(0, 0, layers[l].cnv.width, layers[l].cnv.height);
}

const drawTiles = () => {
    if (camera.moved || frameCount % Math.floor(60 / TILE_FRAMERATE) == 0) {
        camera.drawObjects(tileGrid.flat().filter(t => t.tile.visible).sort((a, b) => (a.tile.y - b.tile.y)).map(gt => gt.tile));
        camera.moved = false;
    }
    if (loop) requestAnimationFrame(drawTiles);
}

const updateTiles = () => {
    tileGrid.forEach(col => col.forEach(i => i.tile.update()));
    if (loop) requestAnimationFrame(updateTiles);
}

const drawItems = () => {
    clearLayer('item');
    camera.drawObjects(tileGrid.flat().filter(t => t.contents?.visible).sort((a, b) => (a.contents.y - b.contents.y)).map(gt => gt.contents));
    camera.drawObjects(extraActors);
    if (loop) requestAnimationFrame(drawItems);
}

const updateItems = () => {
    tileGrid.forEach(col => col.filter(t => t.contents).forEach(i => i.contents.update()));
    extraActors.forEach(a => { if (a.removeNextDraw) a.destroy() });
    extraActors.forEach(i => i.update());
    if (loop) requestAnimationFrame(updateItems);
}

const drawUI = () => {

    drawnObjs = 0;
    // UI
    UIElements.forEach(el => { if (el.removeNextDraw) el.destroy() });

    for (let el of UIElements.sort((a, b) => a.z - b.z)) {
        el.clear();
        el.draw();
    }

    // if (frameCount % 100 == 0) console.log(flatArray.length, UIElements.length, drawnObjs + UIElements.length)
}

const drawDebug = () => {
    fps = 1000 / frameTime;
    prevFPSs.push(fps);

    if (prevFPSs.length > 30) prevFPSs.shift();

    avgFps = avg(prevFPSs);

    let ctx = layers[LAYERNUMBERS.debug].ctx;
    //DEBUG
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.clearRect(0, layers[0].cnv.height - 20, layers[0].cnv.width, 20);
    ctx.fillRect(0, layers[0].cnv.height - 20, layers[0].cnv.width, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('FPS: ' + avgFps.toFixed(2), 10, layers[0].cnv.height - 4);
    ctx.fillText('rev' + version, layers[0].cnv.width - 120, layers[0].cnv.height - 4);
    ctx.fillText(`[${((camera.x + camera.viewWidth / 2) - 32).toPrecision(4)},${((camera.y + camera.viewHeight / 2) - 48).toPrecision(4)}]`, layers[0].cnv.width / 2, layers[0].cnv.height - 4);
    ctx.fillText(`{${drawnObjs}:${UIElements.length}}`, 128, layers[0].cnv.height - 4);
    ctx.fillText(`Touchscreen Only`, 300, layers[0].cnv.height - 4);
    // Crosshair
    // ctx.beginPath();
    // ctx.moveTo(layers[0].cnv.width / 2, 0);
    // ctx.lineTo(layers[0].cnv.width / 2, layers[0].cnv.height - 20);
    // ctx.moveTo(0, layers[0].cnv.height / 2);
    // ctx.lineTo(layers[0].cnv.width, layers[0].cnv.height / 2);
    // ctx.stroke();
    // ctx.closePath();
}

const mainLoop = (t: DOMHighResTimeStamp) => {
    frameTime = t - lastT;
    lastT = t;
    fElapsedTime = frameTime / 100;

    for (let s in sprites) {
        sprites[s].draw();
    }

    drawUI();

    handleInput();

    if (DEBUG.showInfo) {
        drawDebug();
    }

    frameCount++;

    if (loop) {
        requestAnimationFrame(mainLoop);
    }
}

// br5 ================= INPUT ================================

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
    if (keysHeld['+'] || keysHeld['=']) {
        camera.scale += 0.01;
        camera.moved = true;
    } else if (keysHeld['-']) {
        camera.scale -= 0.01;
        camera.moved = true;
    }
}

export const pickup = (dragged, callback?) => {
    // item dragging listeners
    let x = 0;
    let y = 0;

    extraActors.push(dragged);

    const moveHandler = e => {
        e.preventDefault();

        camera.moved = true; // force tile redraw

        if (dragged.gridX != -1 && dragged.gridY != -1) tileGrid[dragged.gridX][dragged.gridY].contents = null;

        x = e.touches[0].pageX - targetBB.x + camera.x;
        y = e.touches[0].pageY - targetBB.y + camera.y;

        if (x > layers[0].cnv.width * 0.9 + camera.x) camera.move(5, 0);
        if (x < layers[0].cnv.width * 0.1 + camera.x) camera.move(-5, 0);
        if (y > layers[0].cnv.height * 0.9 + camera.y) camera.move(0, 5);
        if (y < layers[0].cnv.height * 0.1 + camera.y) camera.move(0, -5);

        dragged._x = (x * 1 / camera.scale) - dragged.width / 2 * camera.scale;
        dragged._y = (y * 1 / camera.scale) - dragged.width / 2 * camera.scale;

        for (let gtile of tileGrid.flat()) {
            let tile = gtile.tile;
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

        camera.moved = true; // force tile redraw

        for (let gtile of tileGrid.flat()) {
            let tile = gtile.tile;
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

        contentDiv.removeEventListener('touchmove', moveHandler);
        contentDiv.removeEventListener('touchend', endHandler);
        if (callback) callback(false);

        extraActors.splice(extraActors.indexOf(dragged), 1);

        if (callback) callback(goodMove);

        if (!goodMove) {
            if (dragged.gridX != -1 && dragged.gridY != -1) tileGrid[dragged.gridX][dragged.gridY].contents = dragged;
        }

        saveGame();
    }

    contentDiv.addEventListener('touchmove', moveHandler);
    contentDiv.addEventListener('touchend', endHandler);

    return true;
}

export const itemTouchListeners = (x, y) => {
    for (let gtile of tileGrid.flat()) {
        let actor = gtile.contents;

        if (actor && actor.draggable && actor.collides(x, y)) {
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

        contentDiv.removeEventListener('touchmove', cameraMoveHandler);
        contentDiv.removeEventListener('touchend', cameraEndHandler);
    }

    contentDiv.addEventListener('touchmove', cameraMoveHandler);
    contentDiv.addEventListener('touchend', cameraEndHandler);
}

const uiTouchListeners = (x, y) => {
    for (let el of UIElements.sort((a, b) => b.x - a.x)) {
        if (el.collidePoint(x, y)) {
            if (!el.interactable) return true; // eat input
            el.act();
            return true;
        }
    }
    return false;
}

export const animalTouchListeners = (x, y) => {
    console.log('Animal touch listeners not implemented!');
    return false;
}

let targetBB = layers[0].cnv.getBoundingClientRect();

const touched = e => {
    e.preventDefault();

    let startX = e.touches[0].pageX - targetBB.x + camera.x;
    let startY = e.touches[0].pageY - targetBB.y + camera.y;

    let x = startX;
    let y = startY;

    if (uiTouchListeners(e.touches[0].pageX - targetBB.x, e.touches[0].pageY - targetBB.y)) {
        return;
    }

    if (state == 'playing') {
        if (tools[tool].act(x, y)) return;
        cameraTouchListeners(x, y, targetBB, startX, startY);
    }
}