import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';

export class InvalidPathError extends Error { };
export class PathNotFoundError extends Error { };

export type Path = (JSON.Integer | JSON.String)[];

export namespace Path {
	export function isPath(value: unknown): value is Path {
		return JSON.isShallowArray(value) && value.every((element) => JSON.isInteger(element) || JSON.isString(element));
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
					return typeof element === 'string' ? `${element}` : `[${element}]`;

				if (typeof element === 'string')
					return `${acc}.${element}`;

				return `${acc}[${element}]`;
			}, '');
	}
}

export class Context {
	public static set(target: JSON.JSON, path: Path, value: JSON.JSON): Result<JSON.JSON, Error> {
		let currentTarget = target;

		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i]!;

			if (JSON.isArray(currentTarget)) {
				if (!JSON.isInteger(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				if (key < 0) {
					currentTarget.unshift(...(new Array(Math.abs(key)).fill(null)));
					currentTarget[0] = typeof path[i + 1] === 'string' ? {} : [];
				}
				else if (key >= currentTarget.length) {
					currentTarget.push(...(new Array(key - currentTarget.length).fill(null)));
					currentTarget.push(typeof path[i + 1] === 'string' ? {} : []);
				}
				else
					currentTarget = currentTarget[key]!;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (!JSON.isString(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				if (!(key in currentTarget))
					currentTarget[key] = typeof path[i + 1] === 'string' ? {} : [];

				currentTarget = currentTarget[key]!;
			}
			else
				return Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
		}

		const lastKey = path[path.length - 1];

		if (JSON.isArray(currentTarget)) {
			if (!JSON.isInteger(lastKey))
				return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));

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
				return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));

			currentTarget[lastKey] = value;
		}
		else
			return Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path)} to be an Array or an Object`));

		return Result.Ok(target);
	}

	public static get(target: JSON.JSON, path: Path): Result<JSON.JSON, Error> {
		let currentTarget = target;

		for (let i = 0; i < path.length; i++) {
			const key = path[i]!;

			if (JSON.isArray(currentTarget)) {
				if (!JSON.isInteger(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				if (key < 0 || key >= currentTarget.length)
					return Result.Err(new PathNotFoundError(`Index ${key} out of bounds at path[${i}]`));

				currentTarget = currentTarget[key] as JSON.JSON;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (!JSON.isString(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				if (!(key in currentTarget))
					return Result.Err(new PathNotFoundError(`Property ${key} not found at path[${i}]`));

				currentTarget = (currentTarget as JSON.Object)[key] as JSON.JSON;
			}
			else
				return Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
		}

		return Result.Ok(currentTarget);
	}

	public static has(target: JSON.JSON, path: Path): boolean {
		let currentTarget = target;

		for (let i = 0; i < path.length; i++) {
			const key = path[i]!;

			if (JSON.isArray(currentTarget)) {
				if (!JSON.isInteger(key))
					return false;

				if (key < 0 || key >= currentTarget.length)
					return false;

				currentTarget = currentTarget[key]!;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (!JSON.isString(key))
					return false;

				if (!(key in currentTarget))
					return false;

				currentTarget = currentTarget[key]!;
			}
			else
				return false;
		}

		return true;
	}

	public static remove(target: JSON.JSON, path: Path): Result<JSON.JSON, Error> {
		let currentTarget = target;

		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i]!;

			if (JSON.isArray(currentTarget)) {
				if (!JSON.isInteger(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				if (key < 0 || key >= currentTarget.length)
					return Result.Err(new PathNotFoundError(`Index ${key} out of bounds at path[${i}]`));

				currentTarget = currentTarget[key]!;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (!JSON.isString(key))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				if (!(key in currentTarget))
					return Result.Err(new PathNotFoundError(`Property ${key} not found at path[${i}]`));

				currentTarget = currentTarget[key]!;
			}
			else
				return Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path, i)} to be an Array or an Object`));
		}

		const lastKey = path[path.length - 1];

		if (JSON.isArray(currentTarget)) {
			if (!JSON.isInteger(lastKey))
				return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be an Integer`));

			if (lastKey < 0 || lastKey >= currentTarget.length)
				return Result.Err(new PathNotFoundError(`Index ${lastKey} out of bounds at path[${path.length - 1}]`));

			currentTarget.splice(lastKey, 1);
		}
		else if (JSON.isShallowObject(currentTarget)) {
			if (!JSON.isString(lastKey))
				return Result.Err(new InvalidPathError(`Expected path[${path.length - 1}] to be a String`));

			delete (currentTarget as JSON.Object)[lastKey];
		}
		else
			return Result.Err(new InvalidPathError(`Expected target at path ${Path.toString(path)} to be an Array or an Object`));

		return Result.Ok(target);
	}

	public static wrap(data: JSON.JSON): Context {
		return new Context(data);
	}

	private _data: JSON.JSON;

	private constructor(data: JSON.JSON) {
		this._data = data;
	}

	public get data(): JSON.JSON {
		return this._data;
	}

	public set(path: Path, value: JSON.JSON): Result<this, Error> {
		return Context.set(JSON.clone(this._data), path, value)
			.mapOk(value => {
				this._data = value;
				return this;
			});
	}

	public get(path: Path): Result<JSON.JSON, Error> {
		return Context.get(this._data, path)
			.mapOk(value => JSON.clone(value));
	}

	public has(path: Path): boolean {
		return Context.has(this._data, path);
	}

	public remove(path: Path): Result<this, Error> {
		return Context.remove(JSON.clone(this._data), path)
			.mapOk(value => {
				this._data = value;
				return this;
			});
	}
}