"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.None = exports.Some = exports.Option = void 0;
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
        if (this.isSome())
            return onSome(this.value);
        else
            return onNone();
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
