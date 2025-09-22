import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
export type Path = (JSON.Integer | JSON.String)[];
export declare namespace Path {
    function isPath(value: unknown): value is Path;
    function equals(path1: Path, path2: Path): boolean;
    function toString(path: Path, from?: number, to?: number): string;
}
export declare namespace Delta {
    class NotFoundError extends Error {
    }
    class OutOfBoundsError extends NotFoundError {
    }
    class KeyNotFoundError extends NotFoundError {
    }
    class InvalidPathError extends Error {
    }
    class TypeMismatchError extends Error {
    }
    function set(target: JSON.JSON, path: Path, value: JSON.JSON): Result<JSON.JSON, Error>;
    function get(target: JSON.JSON, path: Path): Result<JSON.JSON, Error>;
    function has(target: JSON.JSON, path: Path): boolean;
    function remove(target: JSON.JSON, path: Path, compress?: boolean): Result<JSON.JSON, Error>;
}
