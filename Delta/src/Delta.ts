import {Result} from '@serum-enterprises/result';
import {JSON} from '@serum-enterprises/json';

export type Path = (JSON.Integer | JSON.String)[];

export namespace Path {
    export function isPath(value: unknown): value is Path {
        return JSON.isShallowArray(value) && value.every((element: unknown): element is (JSON.Integer | JSON.String) => JSON.isInteger(element) || JSON.isString(element));
    }

    export function equals(path1: Path, path2: Path): boolean {
        if (path1.length !== path2.length)
            return false;

        for (let i = 0; i < path1.length; i++) {
            if (path1[i] !== path2[i])
                return false;
        }

        return true;
    }

    export function toString(path: Path, from?: number, to?: number): string {
        return path.slice(from, to)
            .reduce<string>((acc, element, i) => {
                if (i === 0)
                    return typeof element === 'string' ? `${element}` : `[${element}]`;

                if (typeof element === 'string')
                    return `${acc}.${element}`;

                return `${acc}[${element}]`;
            }, '');
    }
}

function round(n: number): number {
    return n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5);
}

function expandArray<T>(target: T[], index: number, value: T, filler: T): number {
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

    if (!JSON.isInteger(index)) {
        const insertAt = Math.floor(index) + 1;
        target.splice(insertAt, 0, value);
        return insertAt;
    }
    else {
        target[index] = value;
    }

    return index;
}

export type Delta = [Path] | [Path, JSON];

export namespace Delta {
    export class NotFoundError extends Error {}

    export class OutOfBoundsError extends NotFoundError {}

    export class KeyNotFoundError extends NotFoundError {}

    export class InvalidPathError extends Error {}

    export class TypeMismatchError extends Error {}

    function walk(target: JSON.JSON, path: Path, create: boolean = false): Result<[JSON.JSON, (number | string)], Error> {
        if (path.length === 0)
            return Result.Err(new InvalidPathError(`Path is empty`));

        let currentTarget: JSON.JSON = target;

        for (let i = 0; i < path.length - 1; i++) {
            let key = path[i]!;

            if (JSON.isShallowArray(currentTarget)) {
                if (!JSON.isInteger(key))
                    return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

                if ((key < 0 || key >= currentTarget.length)) {
                    if (create)
                        key = expandArray(currentTarget, key, typeof path[i + 1] === 'string' ? {} : [], null);
                    else
                        return Result.Err(new OutOfBoundsError(`Target at path[${i}] is Out of Bounds`));
                }

                currentTarget = currentTarget[key]!;
            }
            else if (JSON.isShallowObject(currentTarget)) {
                if (!JSON.isString(key))
                    return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

                if (!Object.hasOwn(currentTarget, key)) {
                    if (create)
                        currentTarget[key] = typeof path[i + 1] === 'string' ? {} : [];
                    else
                        return Result.Err(new KeyNotFoundError(`Target at path[${i}] not found`));
                }

                currentTarget = currentTarget[key]!;
            }
            else
                return Result.Err(new TypeMismatchError(`Target at ${Path.toString(path, 0, i)} is not an Array or Object`));
        }

        return Result.Ok([currentTarget, path[path.length - 1]!]);
    }

    export function atomicSet(target: JSON.JSON, path: Path, value: JSON.JSON): Result<JSON.JSON, Error> {
        if (path.length === 0)
            return Result.Ok(value);

        const clonedTarget = JSON.clone(target);

        return walk(clonedTarget, path, true)
            .match<Result<JSON.JSON, Error>>(
                ([currentTarget, lastKey]) => {
                    if (JSON.isShallowArray(currentTarget)) {
                        if (!JSON.isInteger(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));

                        expandArray(currentTarget, lastKey, value, null);

                        return Result.Ok(clonedTarget);
                    }

                    if (JSON.isShallowObject(currentTarget)) {
                        if (!JSON.isString(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));

                        currentTarget[lastKey] = value;

                        return Result.Ok(clonedTarget);
                    }

                    return Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
                },
                error => Result.Err(error)
            );
    }

    export function atomicGet(target: JSON.JSON, path: Path): Result<JSON.JSON, Error> {
        if (path.length === 0)
            return Result.Ok(target);

        return walk(target, path, false)
            .match<Result<JSON.JSON, Error>>(
                ([currentTarget, lastKey]) => {
                    if (JSON.isShallowArray(currentTarget)) {
                        if (!JSON.isInteger(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));

                        if (lastKey < 0 || lastKey >= currentTarget.length)
                            return Result.Err(new OutOfBoundsError(`Target at path[${path.length - 1}] is Out of Bounds`));

                        return Result.Ok(currentTarget[lastKey]!);
                    }

                    if (JSON.isShallowObject(currentTarget)) {
                        if (!JSON.isString(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));

                        if (!Object.hasOwn(currentTarget, lastKey))
                            return Result.Err(new KeyNotFoundError(`Target at path[${path.length - 1}] not found`));

                        return Result.Ok(currentTarget[lastKey]!);
                    }

                    return Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
                },
                error => Result.Err(error)
            );
    }

    export function atomicHas(target: JSON.JSON, path: Path): boolean {
        return atomicGet(target, path)
            .match(
                () => true,
                () => false
            );
    }

    export function atomicRemove(target: JSON.JSON, path: Path, compress: boolean = true): Result<JSON.JSON, Error> {
        if (path.length === 0)
            return Result.Err(new InvalidPathError(`Cannot remove target`));

        const clonedTarget = JSON.clone(target);

        return walk(clonedTarget, path, false)
            .match(
                ([currentTarget, lastKey]) => {
                    if (JSON.isShallowArray(currentTarget)) {
                        if (!JSON.isInteger(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));

                        if (lastKey < 0 || lastKey >= currentTarget.length)
                            return Result.Ok(clonedTarget);

                        if (compress)
                            currentTarget.splice(lastKey, 1);
                        else
                            currentTarget[lastKey] = null;

                        return Result.Ok(clonedTarget);
                    }

                    if (JSON.isShallowObject(currentTarget)) {
                        if (!JSON.isString(lastKey))
                            return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));

                        if (!Object.hasOwn(currentTarget, lastKey))
                            return Result.Ok(clonedTarget);

                        if (compress)
                            delete currentTarget[lastKey];
                        else
                            currentTarget[lastKey] = null;

                        return Result.Ok(clonedTarget);
                    }

                    return Result.Err(new TypeMismatchError(`Target at ${Path.toString(path)} is not an Array or Object`));
                },
                error => {
                    if (error instanceof NotFoundError)
                        return Result.Ok(clonedTarget);
                    else
                        return Result.Err(error);
                }
            );
    }

    export function apply(target: JSON, delta: Delta, compress: boolean = true): Result<JSON, Error> {
        if(delta.length === 1)
            return atomicRemove(target, delta[0]!, compress);
        else
            return atomicSet(target, delta[0]!, delta[1]!);
    }

    export function applyMany(target: JSON, deltas: Delta[], compress: boolean = true): Result<JSON, Error> {
        let currentTarget = target;

        for (let i = 0; i < deltas.length; i++) {
            const result = Delta.apply(currentTarget, deltas[i]!, compress);

            if(result.isOk())
                currentTarget = result.value;

            if(result.isErr())
                return result;
        }

        return Result.Ok(currentTarget);
    }
}