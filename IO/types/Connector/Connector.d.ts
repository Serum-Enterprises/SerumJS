import { Result } from '@serum-enterprises/result';
export declare namespace Error {
    class Error extends globalThis.Error {
    }
    class NoEntryError extends Error {
    }
    class IsDirectoryError extends Error {
    }
    class NotDirectoryError extends Error {
    }
    class AlreadyExistsError extends Error {
    }
    class InvalidArgumentError extends Error {
    }
}
export declare abstract class DirectoryEntry {
    abstract isFile(): boolean;
    abstract isDirectory(): boolean;
    abstract isBlockDevice(): boolean;
    abstract isCharacterDevice(): boolean;
    abstract isSymbolicLink(): boolean;
    abstract isFIFO(): boolean;
    abstract isSocket(): boolean;
    abstract get name(): string;
    abstract get parentPath(): string;
}
export declare abstract class Connector {
    protected _workingDir: string;
    protected _sandbox: boolean;
    constructor(workingDir: string, sandbox: boolean);
    get rootDir(): string;
    get isSandboxed(): boolean;
    resolvePath(pathname: string): Result<string, Error.InvalidArgumentError>;
    abstract readFileSync(filename: string): Result<string, Error.Error>;
    abstract writeFileSync(filename: string, data: string): Result<void, Error.Error>;
    abstract appendFileSync(filename: string, data: string): Result<void, Error.Error>;
    abstract deleteFileSync(filename: string): Result<void, Error>;
    abstract createDirectorySync(dirname: string): Result<void, Error.Error>;
    abstract readDirectorySync(dirname: string): Result<DirectoryEntry[], Error.Error>;
    abstract deleteDirectorySync(dirname: string): Result<void, Error.Error>;
}
