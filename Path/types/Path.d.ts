import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
export declare class InvalidPathError extends Error {
}
export declare class PropertyNotFoundError extends Error {
}
export declare class IndexNotfoundError extends Error {
}
export type PathElement = (JSON.Integer | JSON.String);
export type Path = PathElement[];
export declare function isPath(value: unknown): value is Path;
export declare function set(target: JSON.JSON, path: Path, data: JSON.JSON): Result<JSON.JSON, Error>;
export declare function get(target: JSON.JSON, path: Path): Result<JSON.JSON, Error>;
export declare function has(target: JSON.JSON, path: Path): boolean;
export declare function remove(target: JSON.JSON, path: Path): boolean;
export declare function equals(path1: Path, path2: Path): boolean;
export declare function toString(path: Path, index?: number): string;
