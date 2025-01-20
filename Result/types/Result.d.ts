export declare abstract class Result<T, E> {
    static attempt<T, E>(fn: () => T): Result<T, E>;
    static Ok<T>(value: T): Ok<T>;
    static Err<E>(error: E): Err<E>;
    isOk(): this is Ok<T>;
    isErr(): this is Err<E>;
    onOk(fn: (value: T) => void): this;
    onErr(fn: (error: E) => void): this;
    mapOk<R>(fn: (value: T) => R): Result<R, E>;
    mapErr<F>(fn: (error: E) => F): Result<T, F>;
    match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R;
}
declare class Ok<T> extends Result<T, never> {
    #private;
    constructor(value: T);
    get value(): T;
}
declare class Err<E> extends Result<never, E> {
    #private;
    constructor(error: E);
    get error(): E;
}
export {};
