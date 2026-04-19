import {Definition, UnknownDefinition} from './Definitions';
import type {SchemaDomain} from './SchemaDomain';

export interface ValidatorClass<V extends Validator = Validator> {
	fromJSON(data: UnknownDefinition, path: string, schemaDomain: SchemaDomain): V;

	new(): V;
}

export abstract class Validator<T = unknown> {
	public abstract assert(data: unknown, path?: string): asserts data is T;

	public validate(data: unknown, path: string = 'data'): T {
		this.assert(data, path);

		return data;
	}

	public test(data: unknown, path: string = 'data'): data is T {
		try {
			this.assert(data, path);
			return true;
		} catch (e) {
			return false;
		}
	}

	public abstract toJSON(): Definition;
}