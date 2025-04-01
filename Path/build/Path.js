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
exports.Context = exports.Path = exports.PathNotFoundError = exports.InvalidPathError = void 0;
const result_1 = require("@serum-enterprises/result");
const JSON = __importStar(require("@serum-enterprises/json"));
class InvalidPathError extends Error {
}
exports.InvalidPathError = InvalidPathError;
;
class PathNotFoundError extends Error {
}
exports.PathNotFoundError = PathNotFoundError;
;
var Path;
(function (Path) {
    function isPath(value) {
        return JSON.isShallowArray(value) && value.every((element) => JSON.isInteger(element) || JSON.isString(element));
    }
    Path.isPath = isPath;
    function equals(path1, path2) {
        if (path1.length !== path2.length)
            return false;
        for (let i = 0; i < path1.length; i++) {
            if (path1[i] !== path2[i])
                return false;
        }
        return true;
    }
    Path.equals = equals;
    function toString(path, index = -1) {
        return (index < 0 ? path : path.slice(index))
            .reduce((acc, element, i) => {
            if (i === 0)
                return typeof element === 'string' ? `${element}` : `[${element}]`;
            if (typeof element === 'string')
                return `${acc}.${element}`;
            return `${acc}[${element}]`;
        }, '');
    }
    Path.toString = toString;
})(Path || (exports.Path = Path = {}));
class Context {
    static wrap(data) {
        return new Context(data);
    }
    _data;
    constructor(data) {
        this._data = data;
    }
    get data() {
        return this._data;
    }
    set(path, value) {
        const result = JSON.clone(this._data);
        let currentTarget = result;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (JSON.isArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
                if (key < 0) {
                    currentTarget.unshift(...(new Array(Math.abs(key)).fill(null)));
                    currentTarget[0] = typeof path[i + 1] === 'string' ? {} : [];
                }
                else if (key >= currentTarget.length) {
                    currentTarget.push(...(new Array(key - currentTarget.length).fill(null)));
                    currentTarget.push(typeof path[i + 1] === 'string' ? {} : []);
                }
                else
                    currentTarget = currentTarget[key];
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));
                if (!(key in currentTarget))
                    currentTarget[key] = typeof path[i + 1] === 'string' ? {} : [];
                currentTarget = currentTarget[key];
            }
            else
                return result_1.Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
        }
        const lastKey = path[path.length - 1];
        if (JSON.isArray(currentTarget)) {
            if (!JSON.isInteger(lastKey))
                return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
            if (lastKey < 0) {
                currentTarget.unshift(...(new Array(Math.abs(lastKey)).fill(null)));
                currentTarget[0] = value;
            }
            else if (lastKey >= currentTarget.length) {
                currentTarget.push(...(new Array(lastKey - currentTarget.length).fill(null)));
                currentTarget.push(value);
            }
            else
                currentTarget[lastKey] = value;
        }
        else if (JSON.isShallowObject(currentTarget)) {
            if (!JSON.isString(lastKey))
                return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
            currentTarget[lastKey] = value;
        }
        else
            return result_1.Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path)} to be an Array or an Object`));
        this._data = result;
        return result_1.Result.Ok(this);
    }
    get(path) {
        let currentTarget = this._data;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (JSON.isArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
                if (key < 0 || key >= currentTarget.length)
                    return result_1.Result.Err(new PathNotFoundError(`Index ${key} out of bounds at path[${i}]`));
                currentTarget = currentTarget[key];
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));
                if (!(key in currentTarget))
                    return result_1.Result.Err(new PathNotFoundError(`Property ${key} not found at path[${i}]`));
                currentTarget = currentTarget[key];
            }
            else
                return result_1.Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
        }
        return result_1.Result.Ok(JSON.clone(currentTarget));
    }
    has(path) {
        let currentTarget = this._data;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (JSON.isArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return false;
                if (key < 0 || key >= currentTarget.length)
                    return false;
                currentTarget = currentTarget[key];
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return false;
                if (!(key in currentTarget))
                    return false;
                currentTarget = currentTarget[key];
            }
            else
                return false;
        }
        return true;
    }
    remove(path) {
        const result = JSON.clone(this._data);
        let currentTarget = result;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (JSON.isArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
                if (key < 0 || key >= currentTarget.length)
                    return result_1.Result.Err(new PathNotFoundError(`Index ${key} out of bounds at path[${i}]`));
                currentTarget = currentTarget[key];
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));
                if (!(key in currentTarget))
                    return result_1.Result.Err(new PathNotFoundError(`Property ${key} not found at path[${i}]`));
                currentTarget = currentTarget[key];
            }
            else
                return result_1.Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
        }
        const lastKey = path[path.length - 1];
        if (JSON.isArray(currentTarget)) {
            if (!JSON.isInteger(lastKey))
                return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
            if (lastKey < 0 || lastKey >= currentTarget.length)
                return result_1.Result.Err(new PathNotFoundError(`Index ${lastKey} out of bounds at path[${path.length - 1}]`));
            currentTarget.splice(lastKey, 1);
        }
        else if (JSON.isShallowObject(currentTarget)) {
            if (!JSON.isString(lastKey))
                return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
            delete currentTarget[lastKey];
        }
        else
            return result_1.Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path)} to be an Array or an Object`));
        this._data = result;
        return result_1.Result.Ok(this);
    }
}
exports.Context = Context;
