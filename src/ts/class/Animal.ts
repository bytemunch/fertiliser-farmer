import { WorldActor } from "./WorldActor.js";
import { Camera } from "./Camera.js";
import { LAYERS, sprites } from "../main.js";

export class Animal extends WorldActor {
    target = [0,0];
    state = 'roam';
    age = 0;//in frames
    lastBred = 0;//relative to age
    lastPoop = 0;//relative to age
    lastAte = 0;//relative to age

    poopTime = 20*60;//frames
    poopSize = 1;

    roam() {
        console.log('Roam not implemented!');
    }

    eat(foodSource) {
        console.log('eating not implemented!')
    }

    poop() {
        console.log('poop not implemented!');
        this.lastPoop = this.age;
    }

    breed(otherAnimal) {
        console.log('breeding not implemented!');
    }

    update() {
        this.age++;
        if (this.age % this.poopTime) this.poop();
    }

    draw(ctx:CanvasRenderingContext2D, cam:Camera) {
        if (!super.draw(ctx, cam)) {
            return false;
        }

        return true;
    }
}

export class Chicken extends Animal {
    constructor(position:[number,number]) {
        super({
            gridPosition:{gridX:-1, gridY: -1},
            layer: LAYERS.ITEM,
            sprite: sprites.chicken,
            type: 'animal-chicken'
        })
    }
}