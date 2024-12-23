"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.None = exports.Some = exports.Option = void 0;
const panic_1 = require("./panic");
class Option {
    static Some(value) {
        return new Some(value);
    }
    static None() {
        return new None();
    }
    isSome() {
        return this instanceof Some;
    }
    isNone() {
        return this instanceof None;
    }
    onSome(fn) {
        if (this.isSome())
            fn(this.value);
        return this;
    }
    onNone(fn) {
        if (this.isNone())
            fn();
        return this;
    }
    map(fn) {
        return this.match(value => Option.Some(fn(value)), () => Option.None());
    }
    match(onSome, onNone) {
        switch (true) {
            case this.isSome():
                return onSome(this.value);
            case this.isNone():
                return onNone();
            default:
                (0, panic_1.panic)("Expected this to be either Some or None");
        }
    }
}
exports.Option = Option;
class Some extends Option {
    #value;
    constructor(value) {
        super();
        this.#value = value;
    }
    get value() {
        return this.#value;
    }
}
exports.Some = Some;
class None extends Option {
}
exports.None = None;
