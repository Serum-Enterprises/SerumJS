import {Definition, DefinitionError} from './lib/util';
import {JSONValidator} from './validators/JSON';
import {BooleanValidator} from './validators/Boolean';
import {NumberValidator} from './validators/Number';
import {StringValidator} from './validators/String';
import {ArrayValidator} from './validators/Array';
import {ObjectValidator} from './validators/Object';
import {JSON} from '@serum-enterprises/json';

export abstract class Validator<T = unknown> {
	public static fromJSON(
		definition: unknown,
		path: string
	): Validator {
		if (!JSON.isShallowObject(definition))
			throw new DefinitionError(`Expected ${path} to be an Object`);

		if (!JSON.isString(definition['type']))
			throw new DefinitionError(`Expected ${path}.type to be a String`);

		switch(definition['type']) {
			case 'json':
				return JSONValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			case 'boolean':
				return BooleanValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			case 'number':
				return NumberValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			case 'string':
				return StringValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			case 'array':
				return ArrayValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			case 'object':
				return ObjectValidator.fromJSON(definition as Definition & {[key: string]: unknown}, path);
			default:
				throw new DefinitionError(`Expected ${path}.type to be a registered Validator`);
		}
	}

	public abstract assert(data: unknown, path: string): asserts data is T;
	public abstract isSubset(other: Validator): boolean;

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