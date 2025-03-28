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
exports.InMemoryConnector = exports.DirectoryEntry = void 0;
const result_1 = require("@serum-enterprises/result");
const IO = __importStar(require("./Connector"));
const path = __importStar(require("path"));
class DirectoryEntry extends IO.DirectoryEntry {
    _isFile;
    _name;
    _parentPath;
    constructor(isFile, name, parentPath) {
        super();
        this._isFile = isFile;
        this._name = name;
        this._parentPath = parentPath;
    }
    isFile() {
        return this._isFile;
    }
    isDirectory() {
        return !this._isFile;
    }
    isBlockDevice() {
        return false;
    }
    isCharacterDevice() {
        return false;
    }
    isSymbolicLink() {
        return false;
    }
    isFIFO() {
        return false;
    }
    isSocket() {
        return false;
    }
    get name() {
        return this._name;
    }
    get parentPath() {
        return this._parentPath;
    }
}
exports.DirectoryEntry = DirectoryEntry;
class Directory extends Map {
}
class InMemoryConnector extends IO.Connector {
    _data;
    constructor(rootDir, sandbox = false) {
        super(rootDir, sandbox);
        this._data = new Directory();
    }
    _walk(pathname, create = false) {
        let pathSegments = pathname.split(path.sep).filter(Boolean);
        let current = this._data;
        for (let i = 0; i < pathSegments.length; i++) {
            if (!(current instanceof Directory))
                return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));
            const name = pathSegments[i];
            if (!current.has(name)) {
                if (!create)
                    return result_1.Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found or part of the path does not exist`));
                current.set(name, new Directory());
            }
            current = current.get(name);
        }
        return result_1.Result.Ok(current);
    }
    readFileSync(filename) {
        return this.resolvePath(filename)
            .match(pathname => {
            return this._walk(pathname)
                .match(value => {
                if (value instanceof Directory)
                    return result_1.Result.Err(new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`));
                return result_1.Result.Ok(value);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    writeFileSync(filename, data) {
        return this.resolvePath(filename)
            .match(pathname => {
            return this._walk(path.dirname(pathname), true)
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));
                const name = path.basename(pathname);
                value.set(name, data);
                return result_1.Result.Ok(void 0);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    appendFileSync(filename, data) {
        return this.resolvePath(filename)
            .match(pathname => {
            return this._walk(path.dirname(pathname), true)
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));
                const name = path.basename(pathname);
                if (value.has(name)) {
                    const file = value.get(name);
                    if (file instanceof Directory)
                        return result_1.Result.Err(new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`));
                    value.set(name, file + data);
                }
                else
                    value.set(name, data);
                return result_1.Result.Ok(void 0);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    deleteFileSync(filename) {
        return this.resolvePath(filename)
            .match(pathname => {
            return this._walk(path.dirname(pathname))
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));
                const name = path.basename(pathname);
                if (!value.has(name))
                    return result_1.Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found`));
                value.delete(name);
                return result_1.Result.Ok(void 0);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    createDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => {
            return this._walk(pathname, true)
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.AlreadyExistsError(`Entry '${pathname}' already exists`));
                return result_1.Result.Ok(void 0);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    readDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => {
            return this._walk(pathname)
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' is not a directory`));
                return result_1.Result.Ok(Array.from(value.entries()).map(([name, value]) => {
                    return new DirectoryEntry(!(value instanceof Directory), name, pathname);
                }));
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
    deleteDirectorySync(dirname) {
        return this.resolvePath(dirname)
            .match(pathname => {
            return this._walk(path.dirname(pathname))
                .match(value => {
                if (!(value instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));
                const name = path.basename(pathname);
                if (!value.has(name))
                    return result_1.Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found`));
                if (!(value.get(name) instanceof Directory))
                    return result_1.Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' is not a directory`));
                value.delete(name);
                return result_1.Result.Ok(void 0);
            }, error => result_1.Result.Err(error));
        }, error => result_1.Result.Err(error));
    }
}
exports.InMemoryConnector = InMemoryConnector;
