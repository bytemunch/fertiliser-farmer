import FullScreenModal from "./FullScreenModal.js";

export default class CloseButton extends HTMLButtonElement {
    _parent: FullScreenModal;

    constructor() {
        super();
        this.addEventListener('click', this.click.bind(this));
        this.textContent = 'X';
    }

    applyStyles() {
        this.style.width = '48px';
        this.style.height = '48px';
        this.style.position = 'absolute';
        this.style.right = '0';
    }

    set parent(p) {
        this._parent = p;
    }

    click() {
        this._parent.close().then(() => {
            this._parent.parentElement.removeChild(this._parent);
        })
    }

    connectedCallback() {
        this.applyStyles();
    }
}