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
exports.Connector = exports.DirectoryEntry = exports.Error = void 0;
const result_1 = require("@serum-enterprises/result");
const path = __importStar(require("path"));
var Error;
(function (Error_1) {
    class Error extends globalThis.Error {
    }
    Error_1.Error = Error;
    class NoEntryError extends Error {
    }
    Error_1.NoEntryError = NoEntryError;
    class IsDirectoryError extends Error {
    }
    Error_1.IsDirectoryError = IsDirectoryError;
    class NotDirectoryError extends Error {
    }
    Error_1.NotDirectoryError = NotDirectoryError;
    class AlreadyExistsError extends Error {
    }
    Error_1.AlreadyExistsError = AlreadyExistsError;
    class InvalidArgumentError extends Error {
    }
    Error_1.InvalidArgumentError = InvalidArgumentError;
})(Error || (exports.Error = Error = {}));
class DirectoryEntry {
}
exports.DirectoryEntry = DirectoryEntry;
class Connector {
    _workingDir;
    _sandbox;
    constructor(workingDir, sandbox) {
        this._workingDir = path.isAbsolute(workingDir) ? workingDir : path.resolve(workingDir);
        this._sandbox = sandbox;
    }
    get rootDir() {
        return this._workingDir;
    }
    get isSandboxed() {
        return this._sandbox;
    }
    resolvePath(pathname) {
        const resolvedPath = path.resolve(this._workingDir, pathname);
        if (this._sandbox && !resolvedPath.startsWith(this._workingDir))
            return result_1.Result.Err(new Error.InvalidArgumentError(`Invalid path: ${pathname} points outside of the sandbox.`));
        return result_1.Result.Ok(resolvedPath);
    }
}
exports.Connector = Connector;
