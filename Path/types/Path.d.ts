import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
export declare namespace Path {
    type Path = (JSON.Integer | JSON.String)[];
    function isPath(value: unknown): value is Path;
    function equals(path1: Path, path2: Path): boolean;
    function toString(path: Path, index?: number): string;
}
export declare class InvalidPathError extends Error {
}
export declare class PathNotFoundError extends Error {
}
export declare function set(target: JSON.JSON, path: Path.Path, value: JSON.JSON): Result<JSON.JSON, Error>;
export declare function get(target: JSON.JSON, path: Path.Path): Result<JSON.JSON, Error>;
export declare function has(target: JSON.JSON, path: Path.Path): boolean;
export declare function remove(target: JSON.JSON, path: Path.Path): Result<JSON.JSON, Error>;
