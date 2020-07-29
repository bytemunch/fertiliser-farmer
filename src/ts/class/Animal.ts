import { WorldActor } from "./WorldActor.js";
import { Camera } from "./Camera.js";
import { sprites, fElapsedTime, flattenArray, tileGrid, IActorOptions, saveGame, LAYERNUMBERS } from "../main.js";
import { Tile } from "./Tile.js";
import { Item } from "./Item.js";

export const newAnimalFromJSON = JSONData => {
    switch (JSONData.type.split('-')[1]) {
        case 'chicken':
            return new Chicken([JSONData._x, JSONData._y])
            default:
                console.error(JSONData.type,'not found');
    }
}

export class Animal extends WorldActor {
    layer = LAYERNUMBERS.animal;
    target = [0, 0];
    state = 'roam';
    age = 0;//in frames
    lastBred = 0;//relative to age
    lastPoop = 0;//relative to age
    lastAte = 0;//relative to age

    poopTime = 5 * 60;//frames
    poopSize = 1;

    directionVec = [Math.random() - 0.5, Math.random() - 0.5];

    speed = 5;

    roam() {
        if (this.age % (10 * 60) == 0) {
            this.directionVec = [(Math.random() - 0.5) * this.speed * fElapsedTime
                , (Math.random() - 0.5) * this.speed * fElapsedTime];
        }
        if (this.underfoot(this.nextPos(this.directionVec))?.type != 'grass') {
            this.directionVec = [(Math.random() - 0.5) * this.speed * fElapsedTime
                , (Math.random() - 0.5) * this.speed * fElapsedTime];
        } else {
            (<number>this._x) += this.directionVec[0];
            (<number>this._y) += this.directionVec[1];
        }
    }

    eat(foodSource) {
        console.log('eating not implemented!')
    }

    poop() {
        let tile: Tile = this.underfoot(this.basePos);
        if (tile?.type == 'grass' && tile?.contents == null) {
            tileGrid[tile.gridX][tile.gridY].contents = new Item({
                gridPosition: { gridX: tile.gridX, gridY: tile.gridY },
                sprite: sprites[`poop-${this.poopSize}`],
                type: `poop`,
                level: this.poopSize
            });
            this.lastPoop = this.age;
            this.state = 'roam';
            saveGame();
        }
    }

    breed(otherAnimal) {
        console.log('breeding not implemented!');
    }

    update() {
        this.age++;
        if (this.age % this.poopTime == 0) this.state = 'poop';
        switch (this.state) {
            case 'roam':
                this.roam();
                break;
            case 'poop':
                this.roam();
                this.poop();
                break;
        }
    }

    get basePos() {
        return [this.x + this.width / 2, this.y + this.height];
    }

    nextPos(velocity) {
        return [this.basePos[0] + velocity[0], this.basePos[1] + velocity[1]]
    }

    underfoot(position) {
        for (let tile of flattenArray(tileGrid)) {
            tile = tile as Tile;
            if (tile.baseClass != 'tile') continue;
            if (tile.collides(position[0], position[1])) {
                return tile;
            }
        }
    }
}

export class Chicken extends Animal {
    constructor(position: [number, number]) {
        super({
            gridPosition: { gridX: 0, gridY: 0 },
            sprite: sprites['animal-chicken'],
            type: 'animal-chicken',
        })

        this.width = 32;
        this.height = 32;

        this._x = position[0];
        this._y = position[1];

        console.log(this);
    }
}