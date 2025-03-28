import { Result } from '@serum-enterprises/result';
import * as IO from './Connector';
export declare class DirectoryEntry extends IO.DirectoryEntry {
    private _isFile;
    private _name;
    private _parentPath;
    constructor(isFile: boolean, name: string, parentPath: string);
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
export declare class InMemoryConnector extends IO.Connector {
    private _data;
    constructor(rootDir: string, sandbox?: boolean);
    private _walk;
    readFileSync(filename: string): Result<string, IO.Error.Error>;
    writeFileSync(filename: string, data: string): Result<void, IO.Error.Error>;
    appendFileSync(filename: string, data: string): Result<void, IO.Error.Error>;
    deleteFileSync(filename: string): Result<void, IO.Error.Error>;
    createDirectorySync(dirname: string): Result<void, IO.Error.Error>;
    readDirectorySync(dirname: string): Result<IO.DirectoryEntry[], IO.Error.Error>;
    deleteDirectorySync(dirname: string): Result<void, IO.Error.Error>;
}
