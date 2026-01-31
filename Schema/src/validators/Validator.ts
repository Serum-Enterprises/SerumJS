import type {Registry} from '../Registry';
import {Definition, DefinitionError} from '../util';

export abstract class Validator<T = unknown> {
	public static fromJSON(
		_definition: Definition & { [key: string]: unknown },
		_path: string,
		_registry: Registry
	): Validator {
		throw new DefinitionError('Cannot call fromJSON on abstract Validator');
	}

	public abstract assert(data: unknown, path: string): asserts data is T;

	public validate(data: unknown, path: string = 'data'): T {
		this.assert(data, path);

		return data;
	}

	public is(data: unknown, path: string = 'data'): data is T {
		try {
			this.assert(data, path);
			return true;
		} catch (e) {
			return false;
		}
	}

	public abstract toJSON(): Definition;
}