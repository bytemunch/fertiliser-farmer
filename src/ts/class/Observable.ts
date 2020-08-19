export default class Observable {
    observers: { [event: string]: Array<(data) => void> } = {};

    subscribe(event: string, fn: (data) => void) {
        if (!this.observers) this.observers = {};
        if (!this.observers[event]) this.observers[event] = [];
        this.observers[event].push(fn);
    }

    unsubscribe(event: string, fn: (data) => void) {
        this.observers[event].splice(this.observers[event].indexOf(fn), 1);
    }

    emit(event: string, data?: any) {
        if (!this.observers[event]) return;
        for (let f of this.observers[event]) {
            f(data);
        }
    }
}