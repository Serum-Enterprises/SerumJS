export declare abstract class Option<T> {
    static Some<T>(value: T): Some<T>;
    static None(): None;
    isSome(): this is Some<T>;
    isNone(): this is None;
    onSome(fn: (value: T) => void): this;
    onNone(fn: () => void): this;
    map<R>(fn: (value: T) => R): Option<R>;
    match<R>(onSome: (value: T) => R, onNone: () => R): R;
}
export declare class Some<T> extends Option<T> {
    #private;
    constructor(value: T);
    get value(): T;
}
export declare class None extends Option<never> {
}
