import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
export declare class InvalidPathError extends Error {
}
export declare class PathNotFoundError extends Error {
}
export type Path = (JSON.Integer | JSON.String)[];
export declare namespace Path {
    function isPath(value: unknown): value is Path;
    function equals(path1: Path, path2: Path): boolean;
    function toString(path: Path, index?: number): string;
}
export declare class Context {
    static set(target: JSON.JSON, path: Path, value: JSON.JSON): Result<JSON.JSON, Error>;
    static get(target: JSON.JSON, path: Path): Result<JSON.JSON, Error>;
    static has(target: JSON.JSON, path: Path): boolean;
    static remove(target: JSON.JSON, path: Path): Result<JSON.JSON, Error>;
    static wrap(data: JSON.JSON): Context;
    private _data;
    private constructor();
    get data(): JSON.JSON;
    set(path: Path, value: JSON.JSON): Result<this, Error>;
    get(path: Path): Result<JSON.JSON, Error>;
    has(path: Path): boolean;
    remove(path: Path): Result<this, Error>;
}
