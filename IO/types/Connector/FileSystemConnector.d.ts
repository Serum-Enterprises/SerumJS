import { Result } from '@serum-enterprises/result';
import * as IO from './Connector';
import * as fs from 'fs';
export declare function convertError(error: NodeJS.ErrnoException, pathname: string): IO.Error.Error;
declare class DirectoryEntry extends IO.DirectoryEntry {
    private _dirent;
    constructor(dirent: fs.Dirent);
    isFile(): boolean;
    isDirectory(): boolean;
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isSymbolicLink(): boolean;
    isFIFO(): boolean;
    isSocket(): boolean;
    get name(): string;
    get parentPath(): string;
}
export declare class FileSystemConnector extends IO.Connector {
    readFileSync(filename: string): Result<string, IO.Error.Error>;
    writeFileSync(filename: string, data: string): Result<void, IO.Error.Error>;
    appendFileSync(filename: string, data: string): Result<void, IO.Error.Error>;
    deleteFileSync(filename: string): Result<void, IO.Error.Error>;
    createDirectorySync(dirname: string): Result<void, IO.Error.Error>;
    readDirectorySync(dirname: string): Result<DirectoryEntry[], IO.Error.Error>;
    deleteDirectorySync(dirname: string): Result<void, IO.Error.Error>;
}
export {};
