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
exports.Delta = exports.Path = void 0;
const result_1 = require("@serum-enterprises/result");
const JSON = __importStar(require("@serum-enterprises/json"));
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
    function toString(path, from, to) {
        return path.slice(from, to)
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
function expandArray(target, index, value, filler) {
    if (index < 0) {
        target.unshift(...(new Array(Math.abs(index))).fill(filler));
        target[0] = value;
        return 0;
    }
    if (index > target.length) {
        target.push(...(new Array(Math.abs(index - target.length))).fill(filler));
        target.push(value);
        return target.length - 1;
    }
    target[index] = value;
    return index;
}
var Delta;
(function (Delta) {
    class NotFoundError extends Error {
    }
    Delta.NotFoundError = NotFoundError;
    class OutOfBoundsError extends NotFoundError {
    }
    Delta.OutOfBoundsError = OutOfBoundsError;
    class KeyNotFoundError extends NotFoundError {
    }
    Delta.KeyNotFoundError = KeyNotFoundError;
    class InvalidPathError extends Error {
    }
    Delta.InvalidPathError = InvalidPathError;
    class TypeMismatchError extends Error {
    }
    Delta.TypeMismatchError = TypeMismatchError;
    function walk(target, path, create = false) {
        if (path.length === 0)
            return result_1.Result.Err(new InvalidPathError(`Path is empty`));
        let currentTarget = target;
        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i];
            if (JSON.isShallowArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
                if ((key < 0 || key >= currentTarget.length)) {
                    if (create)
                        key = expandArray(currentTarget, key, typeof path[i + 1] === 'string' ? {} : [], null);
                    else
                        return result_1.Result.Err(new OutOfBoundsError(`Target at path[${i}] is Out of Bounds`));
                }
                currentTarget = currentTarget[key];
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));
                if (!Object.hasOwn(currentTarget, key)) {
                    if (create)
                        currentTarget[key] = typeof path[i + 1] === 'string' ? {} : [];
                    else
                        return result_1.Result.Err(new KeyNotFoundError(`Target at path[${i}] not found`));
                }
                currentTarget = currentTarget[key];
            }
            else
                return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path, 0, i)} is not an Array or Object`));
        }
        return result_1.Result.Ok([currentTarget, path[path.length - 1]]);
    }
    function set(target, path, value) {
        if (path.length === 0)
            return result_1.Result.Ok(value);
        const clonedTarget = JSON.clone(target);
        return walk(clonedTarget, path, true)
            .match(([currentTarget, lastKey]) => {
            if (JSON.isShallowArray(currentTarget)) {
                if (!JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                expandArray(currentTarget, lastKey, value, null);
                return result_1.Result.Ok(clonedTarget);
            }
            if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
                currentTarget[lastKey] = value;
                return result_1.Result.Ok(clonedTarget);
            }
            return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
        }, error => result_1.Result.Err(error));
    }
    Delta.set = set;
    function get(target, path) {
        if (path.length === 0)
            return result_1.Result.Ok(target);
        return walk(target, path, false)
            .match(([currentTarget, lastKey]) => {
            if (JSON.isShallowArray(currentTarget)) {
                if (!JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                if (lastKey < 0 || lastKey >= currentTarget.length)
                    return result_1.Result.Err(new OutOfBoundsError(`Target at path[${path.length - 1}] is Out of Bounds`));
                return result_1.Result.Ok(currentTarget[lastKey]);
            }
            if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
                if (!Object.hasOwn(currentTarget, lastKey))
                    return result_1.Result.Err(new KeyNotFoundError(`Target at path[${path.length - 1}] not found`));
                return result_1.Result.Ok(currentTarget[lastKey]);
            }
            return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
        }, error => result_1.Result.Err(error));
    }
    Delta.get = get;
    function has(target, path) {
        return get(target, path)
            .match(() => true, () => false);
    }
    Delta.has = has;
    function remove(target, path, compress = false) {
        if (path.length === 0)
            return result_1.Result.Err(new InvalidPathError(`Cannot remove target`));
        const clonedTarget = JSON.clone(target);
        return walk(clonedTarget, path, false)
            .match(([currentTarget, lastKey]) => {
            if (JSON.isShallowArray(currentTarget)) {
                if (!JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                if (lastKey < 0 || lastKey >= currentTarget.length)
                    return result_1.Result.Ok(clonedTarget);
                if (compress)
                    currentTarget.splice(lastKey, 1);
                else
                    currentTarget[lastKey] = null;
                return result_1.Result.Ok(clonedTarget);
            }
            if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
                if (!Object.hasOwn(currentTarget, lastKey))
                    return result_1.Result.Ok(clonedTarget);
                if (compress)
                    delete currentTarget[lastKey];
                else
                    currentTarget[lastKey] = null;
                return result_1.Result.Ok(clonedTarget);
            }
            return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
        }, error => {
            if (error instanceof NotFoundError)
                return result_1.Result.Ok(clonedTarget);
            else
                return result_1.Result.Err(error);
        });
    }
    Delta.remove = remove;
})(Delta || (exports.Delta = Delta = {}));
