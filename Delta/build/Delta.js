"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delta = exports.Path = void 0;
const result_1 = require("@serum-enterprises/result");
const json_1 = require("@serum-enterprises/json");
var Path;
(function (Path) {
    function isPath(value) {
        return json_1.JSON.isShallowArray(value) && value.every((element) => json_1.JSON.isInteger(element) || json_1.JSON.isString(element));
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
function round(n) {
    return n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5);
}
function expandArray(target, index, value, filler) {
    if (index < 0) {
        if (index > -.5)
            target.unshift(value);
        else {
            const normalizedIndex = round(index);
            target.unshift(...(new Array(Math.abs(normalizedIndex))).fill(filler));
            target[0] = value;
        }
        return 0;
    }
    if (index > target.length) {
        if (index < target.length + .5)
            target.push(value);
        else {
            const normalizedIndex = round(index);
            target.push(...(new Array(Math.abs(normalizedIndex - target.length))).fill(filler));
            target.push(value);
        }
        return target.length - 1;
    }
    if (!json_1.JSON.isInteger(index)) {
        const insertAt = Math.floor(index) + 1;
        target.splice(insertAt, 0, value);
        return insertAt;
    }
    else {
        target[index] = value;
    }
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
            if (json_1.JSON.isShallowArray(currentTarget)) {
                if (!json_1.JSON.isInteger(key))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));
                if ((key < 0 || key >= currentTarget.length)) {
                    if (create)
                        key = expandArray(currentTarget, key, typeof path[i + 1] === 'string' ? {} : [], null);
                    else
                        return result_1.Result.Err(new OutOfBoundsError(`Target at path[${i}] is Out of Bounds`));
                }
                currentTarget = currentTarget[key];
            }
            else if (json_1.JSON.isShallowObject(currentTarget)) {
                if (!json_1.JSON.isString(key))
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
    function atomicSet(target, path, value) {
        if (path.length === 0)
            return result_1.Result.Ok(value);
        const clonedTarget = json_1.JSON.clone(target);
        return walk(clonedTarget, path, true)
            .match(([currentTarget, lastKey]) => {
            if (json_1.JSON.isShallowArray(currentTarget)) {
                if (!json_1.JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                expandArray(currentTarget, lastKey, value, null);
                return result_1.Result.Ok(clonedTarget);
            }
            if (json_1.JSON.isShallowObject(currentTarget)) {
                if (!json_1.JSON.isString(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
                currentTarget[lastKey] = value;
                return result_1.Result.Ok(clonedTarget);
            }
            return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
        }, error => result_1.Result.Err(error));
    }
    Delta.atomicSet = atomicSet;
    function atomicGet(target, path) {
        if (path.length === 0)
            return result_1.Result.Ok(target);
        return walk(target, path, false)
            .match(([currentTarget, lastKey]) => {
            if (json_1.JSON.isShallowArray(currentTarget)) {
                if (!json_1.JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                if (lastKey < 0 || lastKey >= currentTarget.length)
                    return result_1.Result.Err(new OutOfBoundsError(`Target at path[${path.length - 1}] is Out of Bounds`));
                return result_1.Result.Ok(currentTarget[lastKey]);
            }
            if (json_1.JSON.isShallowObject(currentTarget)) {
                if (!json_1.JSON.isString(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));
                if (!Object.hasOwn(currentTarget, lastKey))
                    return result_1.Result.Err(new KeyNotFoundError(`Target at path[${path.length - 1}] not found`));
                return result_1.Result.Ok(currentTarget[lastKey]);
            }
            return result_1.Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
        }, error => result_1.Result.Err(error));
    }
    Delta.atomicGet = atomicGet;
    function atomicHas(target, path) {
        return atomicGet(target, path)
            .match(() => true, () => false);
    }
    Delta.atomicHas = atomicHas;
    function atomicRemove(target, path, compress = true) {
        if (path.length === 0)
            return result_1.Result.Err(new InvalidPathError(`Cannot remove target`));
        const clonedTarget = json_1.JSON.clone(target);
        return walk(clonedTarget, path, false)
            .match(([currentTarget, lastKey]) => {
            if (json_1.JSON.isShallowArray(currentTarget)) {
                if (!json_1.JSON.isInteger(lastKey))
                    return result_1.Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));
                if (lastKey < 0 || lastKey >= currentTarget.length)
                    return result_1.Result.Ok(clonedTarget);
                if (compress)
                    currentTarget.splice(lastKey, 1);
                else
                    currentTarget[lastKey] = null;
                return result_1.Result.Ok(clonedTarget);
            }
            if (json_1.JSON.isShallowObject(currentTarget)) {
                if (!json_1.JSON.isString(lastKey))
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
    Delta.atomicRemove = atomicRemove;
    function apply(target, delta, compress = true) {
        if (delta.length === 1)
            return atomicRemove(target, delta[0], compress);
        else
            return atomicSet(target, delta[0], delta[1]);
    }
    Delta.apply = apply;
    function applyMany(target, deltas, compress = true) {
        let currentTarget = target;
        for (let i = 0; i < deltas.length; i++) {
            const result = Delta.apply(currentTarget, deltas[i], compress);
            if (result.isOk())
                currentTarget = result.value;
            if (result.isErr())
                return result;
        }
        return result_1.Result.Ok(currentTarget);
    }
    Delta.applyMany = applyMany;
})(Delta || (exports.Delta = Delta = {}));
