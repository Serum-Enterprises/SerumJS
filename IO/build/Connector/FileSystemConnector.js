"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemConnector = void 0;
exports.convertError = convertError;
const result_1 = require("@serum-enterprises/result");
const IO = __importStar(require("./Connector"));
const fs = __importStar(require("fs"));
function convertError(error, pathname) {
    switch (error.code) {
        case 'ENOENT':
            return new IO.Error.NoEntryError(`Entry '${pathname}' not found or part of the path does not exist`);
        case 'EISDIR':
            return new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`);
        case 'ENOTDIR':
            return new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`);
        case 'EEXIST':
            return new IO.Error.AlreadyExistsError(`Entry '${pathname}' already exists`);
        case 'EINVAL':
            return new IO.Error.InvalidArgumentError(`Invalid argument for entry '${pathname}'`);
        default:
            return new IO.Error.Error(error.message);
    }
}
class DirectoryEntry extends IO.DirectoryEntry {
    _dirent;
    constructor(dirent) {
        super();
        this._dirent = dirent;
    }
    isFile() {
        return this._dirent.isFile();
    }
    isDirectory() {
        return this._dirent.isDirectory();
    }
    isBlockDevice() {
        return this._dirent.isBlockDevice();
    }
    isCharacterDevice() {
        return this._dirent.isCharacterDevice();
    }
    isSymbolicLink() {
        return this._dirent.isSymbolicLink();
    }
    isFIFO() {
        return this._dirent.isFIFO();
    }
    isSocket() {
        return this._dirent.isSocket();
    }
    get name() {
        return this._dirent.name;
    }
    get parentPath() {
        return this._dirent.parentPath;
    }
}
class FileSystemConnector extends IO.Connector {
    readFileSync(filename) {
        return this.resolvePath(filename)
            .match(pathname => result_1.Result.attempt(() => fs.readFileSync(pathname, 'utf8'))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    writeFileSync(filename, data) {
        return this.resolvePath(filename)
            .match(pathname => result_1.Result.attempt(() => fs.writeFileSync(pathname, data))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    appendFileSync(filename, data) {
        return this.resolvePath(filename)
            .match(pathname => result_1.Result.attempt(() => fs.appendFileSync(pathname, data))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    deleteFileSync(filename) {
        return this.resolvePath(filename)
            .match(pathname => result_1.Result.attempt(() => fs.unlinkSync(pathname))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    createDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => result_1.Result.attempt(() => fs.mkdirSync(pathname, { recursive: true }))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    readDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => result_1.Result.attempt(() => fs.readdirSync(pathname, { withFileTypes: true }))
            .mapOk(entries => entries.map(dirent => new DirectoryEntry(dirent)))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
    deleteDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => result_1.Result.attempt(() => fs.rmSync(pathname, { recursive: true, force: true }))
            .mapErr(error => convertError(error, pathname)), error => result_1.Result.Err(error));
    }
}
exports.FileSystemConnector = FileSystemConnector;
