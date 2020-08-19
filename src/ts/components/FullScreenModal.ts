import CloseButton from "./CloseButton.js";
customElements.define('sce-close', CloseButton, { extends: 'button' });

export default abstract class FullScreenModal extends HTMLElement {
    content: HTMLDivElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    applyStyles() {
        let style = new CSSStyleSheet;

        style.replace(`
        :host {
            width: 100vw;
            height: 100vh;
            background-color: rgba(0,0,0,0.5);
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
        }

        #content {
            width: 90vw;
            height: 90vh;
            background-color: blue;
            position: absolute;
            left: 5vw;
            top: 5vh;
        }
        
        button {
            background-color: green;
        }`)

        this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, style]
    }

    open(dir: PlaybackDirection = 'normal') {
        let duration = 300;
        this.animate([{
            opacity: 0
        },
        {
            opacity: 1
        }], { duration, fill: 'forwards', easing: 'ease-out', direction: dir })

        this.content.animate([{
            top: '150vh'
        },
        {
            top: '5vh'
        }], { duration, fill: 'forwards', easing: 'ease-out', direction: dir })


        return new Promise((res) => {
            setTimeout(res, duration);
        })
    }

    close() {
        return this.open('reverse');
    }

    connectedCallback() {
        this.applyStyles();

        this.content = document.createElement('div');
        this.content.id = 'content';

        let close = new CloseButton;
        close.parent = this;
        this.content.appendChild(close);

        this.shadowRoot.appendChild(this.content);
    }
}