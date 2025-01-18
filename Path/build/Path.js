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
exports.IndexNotfoundError = exports.PropertyNotFoundError = exports.InvalidPathError = void 0;
exports.isPath = isPath;
exports.set = set;
exports.get = get;
exports.has = has;
exports.remove = remove;
exports.equals = equals;
exports.toString = toString;
const result_1 = require("@serum-enterprises/result");
const JSON = __importStar(require("@serum-enterprises/json"));
class InvalidPathError extends Error {
}
exports.InvalidPathError = InvalidPathError;
;
class PropertyNotFoundError extends Error {
}
exports.PropertyNotFoundError = PropertyNotFoundError;
;
class IndexNotfoundError extends Error {
}
exports.IndexNotfoundError = IndexNotfoundError;
;
function isPath(value) {
    return JSON.isShallowArray(value) && value.every((element) => JSON.isInteger(element) || JSON.isString(element));
}
function walk(target, path, createContainers = false) {
    if (path.length === 0)
        return result_1.Result.Err(new InvalidPathError('Expected path to have at least one Element'));
    let currentTarget = target;
    for (let i = 0; i < path.length; i++) {
        if (JSON.isArray(currentTarget)) {
            if (!Number.isSafeInteger(path[i]))
                return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
            const pathElement = path[i];
            if (i === path.length - 1) {
                return result_1.Result.Ok({ parent: currentTarget, key: pathElement });
            }
            else {
                if (!createContainers && (pathElement < 0 || pathElement >= currentTarget.length))
                    return result_1.Result.Err(new IndexNotfoundError(`Index ${pathElement} out of Bounds at ${toString(path, i)}`));
                if (pathElement < 0) {
                    currentTarget.unshift(...(new Array(Math.abs(pathElement)).fill(null)));
                    currentTarget[0] = typeof path[i + 1] === 'string' ? {} : [];
                }
                else if (pathElement >= currentTarget.length) {
                    currentTarget.push(...(new Array(pathElement - currentTarget.length).fill(null)));
                    currentTarget.push(typeof path[i + 1] === 'string' ? {} : []);
                }
                currentTarget = currentTarget[pathElement];
            }
        }
        else if (JSON.isShallowObject(currentTarget)) {
            if (typeof path[i] !== 'string')
                return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));
            const pathElement = path[i];
            if (i === path.length - 1)
                return result_1.Result.Ok({ parent: currentTarget, key: pathElement });
            else {
                if (!(pathElement in currentTarget)) {
                    if (!createContainers)
                        return result_1.Result.Err(new PropertyNotFoundError(`Property ${pathElement} not found at ${toString(path, i)}`));
                    currentTarget[pathElement] = typeof path[i + 1] === 'string' ? {} : [];
                }
                currentTarget = currentTarget[pathElement];
            }
        }
        else
            return result_1.Result.Err(new TypeError(`Expected target at path ${toString(path, i)} to be an Array or an Object`));
    }
    return result_1.Result.Err(new Error('Path not found'));
}
function set(target, path, data) {
    if (path.length === 0)
        return result_1.Result.Ok(data);
    return walk(target, path, true)
        .mapOk(({ parent, key }) => {
        if (JSON.isArray(parent)) {
            if (key < 0) {
                parent.unshift(...(new Array(Math.abs(key)).fill(null)));
                parent[0] = data;
            }
            else if (key >= parent.length) {
                parent.push(...(new Array(key - parent.length).fill(null)));
                parent.push(data);
            }
            else
                parent[key] = data;
        }
        else
            parent[key] = data;
        return target;
    });
}
function get(target, path) {
    if (path.length === 0)
        return result_1.Result.Ok(target);
    return walk(target, path, false).match(value => {
        if (JSON.isArray(value.parent)) {
            if (!JSON.isInteger(value.key))
                return result_1.Result.Err(new InvalidPathError(`Expected key to be an Integer at ${toString(path)}`));
            if (value.key < 0 || value.key >= value.parent.length)
                return result_1.Result.Err(new IndexNotfoundError(`Index ${value.key} out of Bounds at ${toString(path)}`));
            return result_1.Result.Ok(value.parent[value.key]);
        }
        else {
            if (!JSON.isString(value.key))
                return result_1.Result.Err(new InvalidPathError(`Expected key to be a String at ${toString(path)}`));
            if (!(value.key in value.parent))
                return result_1.Result.Err(new PropertyNotFoundError(`Property ${value.key} not found at ${toString(path)}`));
            return result_1.Result.Ok(value.parent[value.key]);
        }
    }, error => result_1.Result.Err(error));
}
function has(target, path) {
    if (path.length === 0)
        return true;
    return walk(target, path, false).match(value => {
        if (JSON.isArray(value.parent)) {
            if (!JSON.isInteger(value.key))
                return false;
            if (value.key < 0 || value.key >= value.parent.length)
                return false;
            return true;
        }
        else {
            if (!JSON.isString(value.key))
                return false;
            if (!(value.key in value.parent))
                return false;
            return true;
        }
    }, _ => false);
}
function remove(target, path) {
    if (path.length === 0)
        return false;
    return walk(target, path, false).onOk(({ parent, key }) => {
        if (JSON.isArray(parent))
            parent.splice(key, 1);
        else
            delete parent[key];
        return true;
    }).isOk();
}
function equals(path1, path2) {
    if (path1.length !== path2.length)
        return false;
    for (let i = 0; i < path1.length; i++) {
        if (path1[i] !== path2[i])
            return false;
    }
    return true;
}
function toString(path, index = -1) {
    return (index < 0 ? path : path.slice(index))
        .reduce((acc, element, i) => {
        if (i === 0)
            return `${element}`;
        if (typeof element === 'string')
            return `${acc}.${element}`;
        return `${acc}[${element}]`;
    }, '');
}
