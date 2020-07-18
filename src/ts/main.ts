import { makeNoise3D } from '../lib/osn.js';
import { Sprite } from './class/Sprite.js';
import { WorldActor } from './class/WorldActor.js';
import { Tile } from './class/Tile.js';
import { Item } from './class/Item.js';
import { Camera } from './class/Camera.js';

let DEBUG = {
    boundingBoxes: false,
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
})

let contentDiv: HTMLDivElement;

let loop = false;

export let worldWidth = 50;

export let worldHeight = worldWidth * 2;

export let viewScale = 1.5;

export let itemManifest = {
    'shit': {
        maxLevel: 5,
        dropTable: {
            coin: [3, 5],
            shit: [1, 3]
        }
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

let camera: Camera;

export let sprites: { [x: string]: Sprite } = {};

interface IGridTile {
    tile: Tile,
    contents: Item
}

export let tileGrid: IGridTile[][] = [];

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

const save = () => {
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
        tileGrid: saveData,
        expandableSpaceHere: true
    }

    localStorage.setItem('save', JSON.stringify(fullState));

    let saved = localStorage.getItem('save')
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

    // createNewGame();
    // save();

    loadGame();

    startLoop();
}

const loadGame = () => {
    let saveData = JSON.parse(localStorage.getItem('save'));

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

// new game
const createNewGame = () => {
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

    if (e.key == 'n') {
        createNewGame();
    }
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

                save();
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