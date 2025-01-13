"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
class Result {
    static Ok(value) {
        return new Ok(value);
    }
    static Err(error) {
        return new Err(error);
    }
    isOk() {
        return this instanceof Ok;
    }
    isErr() {
        return this instanceof Err;
    }
    onOk(fn) {
        if (this.isOk())
            fn(this.value);
        return this;
    }
    onErr(fn) {
        if (this.isErr())
            fn(this.error);
        return this;
    }
    mapOk(fn) {
        return this.match(value => Result.Ok(fn(value)), error => Result.Err(error));
    }
    mapErr(fn) {
        return this.match(value => Result.Ok(value), error => Result.Err(fn(error)));
    }
    match(onOk, onErr) {
        if (this.isOk())
            return onOk(this.value);
        else
            return onErr(this.error);
    }
}
exports.Result = Result;
class Ok extends Result {
    #value;
    constructor(value) {
        super();
        this.#value = value;
    }
    get value() {
        return this.#value;
    }
}
class Err extends Result {
    #error;
    constructor(error) {
        super();
        this.#error = error;
    }
    get error() {
        return this.#error;
    }
}
