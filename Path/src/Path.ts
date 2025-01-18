import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';

export class InvalidPathError extends Error { };
export class PropertyNotFoundError extends Error { };
export class IndexNotfoundError extends Error { };

export type PathElement = (JSON.Integer | JSON.String);
export type Path = PathElement[];

export function isPath(value: unknown): value is Path {
	return JSON.isShallowArray(value) && value.every((element) => JSON.isInteger(element) || JSON.isString(element));
}

function walk(target: JSON.JSON, path: Path, createContainers: boolean = false): Result<{ parent: JSON.Container, key: PathElement }, Error> {
	if (path.length === 0)
		return Result.Err(new InvalidPathError('Expected path to have at least one Element'));

	let currentTarget: JSON.JSON = target;

	for (let i = 0; i < path.length; i++) {
		if (JSON.isArray(currentTarget)) {
			if (!Number.isSafeInteger(path[i]))
				return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

			const pathElement = path[i] as number;

			if (i === path.length - 1) {
				return Result.Ok({ parent: currentTarget, key: pathElement });
			}
			else {
				if (!createContainers && (pathElement < 0 || pathElement >= currentTarget.length))
					return Result.Err(new IndexNotfoundError(`Index ${pathElement} out of Bounds at ${toString(path, i)}`));

				if (pathElement < 0) {
					currentTarget.unshift(...(new Array(Math.abs(pathElement)).fill(null)));
					currentTarget[0] = typeof path[i + 1] === 'string' ? {} : [];
				}
				else if (pathElement >= currentTarget.length) {
					currentTarget.push(...(new Array(pathElement - currentTarget.length).fill(null)));
					currentTarget.push(typeof path[i + 1] === 'string' ? {} : []);
				}

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
		}
		else if (JSON.isShallowObject(currentTarget)) {
			if (typeof path[i] !== 'string')
				return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

			const pathElement = path[i] as string;

			if (i === path.length - 1)
				return Result.Ok({ parent: currentTarget, key: pathElement });
			else {
				if (!(pathElement in currentTarget)) {
					if (!createContainers)
						return Result.Err(new PropertyNotFoundError(`Property ${pathElement} not found at ${toString(path, i)}`));

					currentTarget[pathElement] = typeof path[i + 1] === 'string' ? {} : [];
				}

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
		}
		else
			return Result.Err(new TypeError(`Expected target at path ${toString(path, i)} to be an Array or an Object`));
	}

	return Result.Err(new Error('Path not found'));
}

export function set(target: JSON.JSON, path: Path, data: JSON.JSON): Result<JSON.JSON, Error> {
	if (path.length === 0)
		return Result.Ok(data);

	return walk(target, path, true)
		.mapOk(({ parent, key }) => {
			if (JSON.isArray(parent)) {
				if ((key as number) < 0) {
					parent.unshift(...(new Array(Math.abs(key as number)).fill(null)));
					parent[0] = data;
				}
				else if ((key as number) >= parent.length) {
					parent.push(...(new Array((key as number) - parent.length).fill(null)));
					parent.push(data);
				}
				else
					parent[key as number] = data;
			}
			else
				parent[key as string] = data;

			return target;
		});
}

export function get(target: JSON.JSON, path: Path): Result<JSON.JSON, Error> {
	if (path.length === 0)
		return Result.Ok(target);

	return walk(target, path, false).match(
		value => {
			if (JSON.isArray(value.parent)) {
				if (!JSON.isInteger(value.key))
					return Result.Err(new InvalidPathError(`Expected key to be an Integer at ${toString(path)}`));

				if (value.key < 0 || value.key >= value.parent.length)
					return Result.Err(new IndexNotfoundError(`Index ${value.key} out of Bounds at ${toString(path)}`));

				return Result.Ok(value.parent[value.key as number] as JSON.JSON);
			}
			else {
				if (!JSON.isString(value.key))
					return Result.Err(new InvalidPathError(`Expected key to be a String at ${toString(path)}`));

				if (!(value.key in value.parent))
					return Result.Err(new PropertyNotFoundError(`Property ${value.key} not found at ${toString(path)}`));

				return Result.Ok(value.parent[value.key as string] as JSON.JSON);
			}
		},
		error => Result.Err(error)
	);
}

export function has(target: JSON.JSON, path: Path): boolean {
	if (path.length === 0)
		return true;

	return walk(target, path, false).match(
		value => {
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
		},
		_ => false
	)
}

export function remove(target: JSON.JSON, path: Path): boolean {
	if (path.length === 0)
		return false;

	return walk(target, path, false).onOk(({ parent, key }) => {
		if (JSON.isArray(parent))
			parent.splice(key as number, 1);
		else
			delete parent[key as string];

		return true;
	}).isOk();
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

export function toString(path: Path, index: number = -1): string {
	return (index < 0 ? path : path.slice(index))
		.reduce<string>((acc, element, i) => {
			if (i === 0)
				return `${element}`;

			if (typeof element === 'string')
				return `${acc}.${element}`;

			return `${acc}[${element}]`;
		}, '');
}