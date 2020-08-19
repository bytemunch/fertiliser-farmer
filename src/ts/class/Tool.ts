import { Sprite } from './Sprite.js';
import { saveGame, changeTool } from '../main.js';

export class Tool {
    img: Sprite;
    uses: number = 0;
    type: string;

    act(x, y) {
        if (this.uses <= 0) {
            this.uses = 0;
            changeTool('hand');
            return false;
        }
        this.uses--;

        saveGame();
        return true;
    }

    addUses(n) {
        this.uses += n;
    }
}
