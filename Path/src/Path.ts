import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';

export class InvalidPathError extends Error { };
export class PropertyNotFoundError extends Error { };
export class IndexNotfoundError extends Error { };

export class Path {
	static isPath(value: unknown): value is (JSON.Integer | JSON.String)[] {
		return JSON.isShallowArray(value) && value.every((element) => JSON.isInteger(element) || JSON.isString(element));
	}

	#path: (JSON.Integer | JSON.String)[];
	#mutateData: boolean;
	#createContainers: boolean;

	constructor(path: (JSON.Integer | JSON.String)[], mutateData: boolean = false, createContainers: boolean = false) {
		this.#path = path;
		this.#mutateData = mutateData;
		this.#createContainers = createContainers;
	}

	get path(): (JSON.Integer | JSON.String)[] {
		return JSON.clone(this.#path);
	}

	get mutateData(): boolean {
		return this.#mutateData;
	}

	get createContainers(): boolean {
		return this.#createContainers;
	}

	get length(): number {
		return this.#path.length;
	}

	prefix(prefix: (JSON.Integer | JSON.String)[]): Path {
		return new Path([...prefix, ...this.#path], this.#mutateData, this.#createContainers);
	}

	suffix(suffix: (JSON.Integer | JSON.String)[]): Path {
		return new Path([...this.#path, ...suffix], this.#mutateData, this.#createContainers);
	}

	_walk(target: JSON.JSON, createContainers: boolean = false): Result<{ parent: JSON.JSON, key: JSON.Integer | JSON.String }, Error> {
		let currentTarget: JSON.JSON = target;

		for (let i = 0; i < this.#path.length; i++) {
			const pathElement = this.#path[i];

			if (JSON.isArray(currentTarget)) {
				if (!JSON.isInteger(pathElement))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				const index = pathElement as number;

				if (i === this.#path.length - 1)
					return Result.Ok({ parent: currentTarget, key: index });

				if (index < 0 || index >= currentTarget.length) {
					if (!createContainers)
						return Result.Err(new IndexNotfoundError(`Index ${index} out of bounds at ${this.toString(i)}`));

					currentTarget[index] = typeof this.#path[i + 1] === 'string' ? {} : [];
				}

				currentTarget = currentTarget[index] as JSON.JSON;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (!JSON.isString(pathElement))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				const key = pathElement as string;

				if (i === this.#path.length - 1)
					return Result.Ok({ parent: currentTarget, key });

				if (!(key in currentTarget)) {
					if (!createContainers)
						return Result.Err(new PropertyNotFoundError(`Property ${key} not found at ${this.toString(i)}`));

					currentTarget[key] = typeof this.#path[i + 1] === 'string' ? {} : [];
				}

				currentTarget = currentTarget[key] as JSON.JSON;
			}
			else
				return Result.Err(new TypeError(`Expected target at path ${this.toString(i)} to be an Array or an Object`));
		}

		return Result.Err(new Error('Path traversal reached an unexpected end'));
	}

	set(target: JSON.JSON, data: JSON.JSON): Result<JSON.JSON, Error> {
		let currentTarget: JSON.JSON = target;

		for (let i = 0; i < this.#path.length; i++) {
			if (JSON.isArray(currentTarget)) {
				if (!Number.isSafeInteger(this.#path[i]))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				const pathElement = this.#path[i] as number;

				if (i === this.#path.length - 1) {
					if (pathElement < 0) {
						currentTarget.unshift(...(new Array(Math.abs(pathElement)).fill(null)));
						currentTarget[0] = data;
					}
					else if (pathElement >= currentTarget.length) {
						currentTarget.push(...(new Array(pathElement - currentTarget.length).fill(null)));
						currentTarget.push(data);
					}
					else
						currentTarget[pathElement] = data;
				}
				else {
					if (!this.#createContainers && (pathElement < 0 || pathElement >= currentTarget.length))
						return Result.Err(new IndexNotfoundError(`Index ${pathElement} out of Bounds at ${this.toString(i)}`));

					if (pathElement < 0) {
						currentTarget.unshift(...(new Array(Math.abs(pathElement)).fill(null)));
						currentTarget[0] = typeof this.#path[i + 1] === 'string' ? {} : [];
					}
					else if (pathElement >= currentTarget.length) {
						currentTarget.push(...(new Array(pathElement - currentTarget.length).fill(null)));
						currentTarget.push(typeof this.#path[i + 1] === 'string' ? {} : []);
					}
					else
						currentTarget = currentTarget[pathElement] as JSON.JSON;
				}
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (typeof this.#path[i] !== 'string')
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				const pathElement = this.#path[i] as string;

				if (i === this.#path.length - 1)
					currentTarget[pathElement] = data;
				else {
					if (!(pathElement in currentTarget)) {
						if (!this.#createContainers)
							return Result.Err(new PropertyNotFoundError(`Property ${pathElement} not found at ${this.toString(i)}`));

						currentTarget[pathElement] = typeof this.#path[i + 1] === 'string' ? {} : [];
					}

					currentTarget = currentTarget[pathElement] as JSON.JSON;
				}
			}
			else
				return Result.Err(new TypeError(`Expected target at path ${this.toString(i)} to be an Array or an Object`));
		}

		return Result.Ok(target);
	}

	get(target: JSON.JSON): Result<JSON.JSON, Error> {
		let currentTarget: JSON.JSON = target;

		for (let i = 0; i < this.#path.length; i++) {
			if (JSON.isArray(currentTarget)) {
				if (!Number.isSafeInteger(this.#path[i]))
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be an Integer`));

				const pathElement = this.#path[i] as number;

				if (pathElement < 0 || pathElement >= currentTarget.length)
					return Result.Err(new IndexNotfoundError('Index out of bounds'));

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (typeof this.#path[i] !== 'string')
					return Result.Err(new InvalidPathError(`Expected path[${i}] to be a String`));

				const pathElement = this.#path[i] as string;

				if (!(pathElement in currentTarget))
					return Result.Err(new PropertyNotFoundError('Property not found'));

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
			else
				return Result.Err(new TypeError(`Expected target at path ${this.toString(i)} to be an Array or an Object`));
		}

		return Result.Ok(currentTarget);
	}

	has(target: JSON.JSON): boolean {
		let currentTarget: JSON.JSON = target;

		for (let i = 0; i < this.#path.length; i++) {
			if (JSON.isArray(currentTarget)) {
				if (!Number.isSafeInteger(this.#path[i]))
					return false;

				const pathElement = this.#path[i] as number;

				if (pathElement < 0 || pathElement >= currentTarget.length)
					return false;

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (typeof this.#path[i] !== 'string')
					return false;

				const pathElement = this.#path[i] as string;

				if (!(pathElement in currentTarget))
					return false;

				currentTarget = currentTarget[pathElement] as JSON.JSON;
			}
			else
				return false;
		}

		return true;
	}

	remove(target: JSON.JSON): boolean {
		let currentTarget: JSON.JSON = target;

		for (let i = 0; i < this.#path.length; i++) {
			if (JSON.isArray(currentTarget)) {
				if (!Number.isSafeInteger(this.#path[i]))
					return false;

				const pathElement = this.#path[i] as number;

				if (i === this.#path.length - 1) {
					if (pathElement < 0 || pathElement >= currentTarget.length)
						return false;

					currentTarget.splice(pathElement, 1);
				}
				else {
					if (pathElement < 0 || pathElement >= currentTarget.length)
						return false;

					currentTarget = currentTarget[pathElement] as JSON.JSON;
				}
			}
			else if (JSON.isShallowObject(currentTarget)) {
				if (typeof this.#path[i] !== 'string')
					return false;

				const pathElement = this.#path[i] as string;

				if (!(pathElement in currentTarget))
					return false;

				if (i === this.#path.length - 1) {
					if (!(pathElement in currentTarget))
						return false;

					delete currentTarget[pathElement];
				}
				else {
					currentTarget = currentTarget[pathElement] as JSON.JSON;
				}
			}
			else
				return false;
		}

		return true;
	}

	equals(path: Path): boolean {
		// Get the Path Array here because the path getter always clones the internal Path Array
		const pathArray = path.path;

		if (this.#path.length !== pathArray.length)
			return false;

		for (let i = 0; i < this.#path.length; i++) {
			if (this.#path[i] !== pathArray[i])
				return false;
		}

		return true;
	}

	toJSON(): JSON.JSON {
		return this.#path;
	}

	toString(index: number = -1): string {
		return (index < 0 ? this.#path : this.#path.slice(index)).reduce<string>((acc, element, i) => {
			if (i === 0)
				return `${element}`;

			if (typeof element === 'string')
				return `${acc}.${element}`;

			return `${acc}[${element}]`;
		}, '');
	}
}