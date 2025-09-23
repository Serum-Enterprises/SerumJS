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
    function atomicSet(target: JSON.JSON, path: Path, value: JSON.JSON): Result<JSON.JSON, Error>;
    function atomicGet(target: JSON.JSON, path: Path): Result<JSON.JSON, Error>;
    function atomicHas(target: JSON.JSON, path: Path): boolean;
    function atomicRemove(target: JSON.JSON, path: Path, compress?: boolean): Result<JSON.JSON, Error>;
    function apply(target: JSON, delta: Delta, compress?: boolean): Result<JSON, Error>;
    function applyMany(target: JSON, deltas: Delta[], compress?: boolean): Result<JSON, Error>;
}
