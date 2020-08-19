import { Tool } from './Tool.js';
import { animalTouchListeners, itemTouchListeners } from '../main.js';
export class HandTool extends Tool {
    type = 'hand';
    uses = Infinity;

    act(x, y) {
        if (!super.act(x, y))
            return false;
        if (animalTouchListeners(x, y))
            return true;
        if (itemTouchListeners(x, y))
            return true;
        return false;
    }
}
