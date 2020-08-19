import FullScreenModal from '../FullScreenModal.js';
import Reel from './Reel.js';
customElements.define('sce-reel', Reel);

export default class SlotComponent extends FullScreenModal {
    reelCount = 3;
    reelGrid: HTMLDivElement;
    reels: Reel[] = [];

    animHandle: number;

    applyStyles() {
        super.applyStyles();

        let style = new CSSStyleSheet;

        style.replace(`
        #reel-grid {
            display: grid;
            grid-template-columns: ${(() => {
                let str = '';
                for (let i = 0; i < this.reelCount; i++) {
                    str += '1fr ';
                }
                return str;
            })()};
            grid-gap: 10px;
            height: 64px;
            width: ${48 * this.reelCount}px;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            top: 50%;
            transform: translateY(-50%);
        }

        sce-reel {
            width: 48px;
            height: 64px;
            background-color: white;
        }
        `)

        this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style]
    }

    connectedCallback() {
        super.connectedCallback();

        this.reelGrid = document.createElement('div');
        this.reelGrid.id = 'reel-grid';


        for (let i = 0; i < this.reelCount; i++) {
            let reel = new Reel;
            reel.init(i + 1);
            reel.subscribe('win', (data) => console.log('reel ' + i + ': ' + data));
            this.reels.push(reel);
            this.reelGrid.appendChild(reel);
        }

        for (let i = 0; i < this.reelCount; i++) {
            let stop = document.createElement('button');
            stop.textContent = 'Stop';
            stop.addEventListener('click', e => {
                this.reels[i].stop();
            })
            this.reelGrid.appendChild(stop);
        }

        this.reelGrid.appendChild(document.createElement('div'));

        let spin = document.createElement('button');
        spin.textContent = 'spin';
        spin.addEventListener('click', e => {
            this.reels.forEach(r => r.spin());
        })
        this.reelGrid.appendChild(spin);

        this.content.appendChild(this.reelGrid);

        this.animHandle = requestAnimationFrame(this.rafReels.bind(this));
    }

    rafReels(t) {
        this.reels.forEach(el => el.draw());
        this.animHandle = requestAnimationFrame(this.rafReels.bind(this));
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.animHandle);
    }
}