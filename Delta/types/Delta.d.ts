import { Result } from '@serum-enterprises/result';
import { JSON } from '@serum-enterprises/json';
export type Path = (JSON.Integer | JSON.String)[];
export declare namespace Path {
    function isPath(value: unknown): value is Path;
    function equals(path1: Path, path2: Path): boolean;
    function toString(path: Path, from?: number, to?: number): string;
}
export type Delta = [Path] | [Path, JSON];
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
    function _set(target: JSON, path: Path, value: JSON): Result<JSON, Error>;
    function set(target: JSON, path: Path, value: JSON): Result<JSON, Error>;
    function _get(target: JSON, path: Path): Result<JSON, Error>;
    function get(target: JSON, path: Path): Result<JSON, Error>;
    function _has(target: JSON, path: Path): boolean;
    function has(target: JSON, path: Path): boolean;
    function _remove(target: JSON, path: Path, compress?: boolean): Result<JSON, Error>;
    function remove(target: JSON, path: Path, compress?: boolean): Result<JSON, Error>;
    function apply(target: JSON, delta: Delta, compress?: boolean): Result<JSON, Error>;
    function applyMany(target: JSON, deltas: Delta[], compress?: boolean): Result<JSON, Error>;
}
