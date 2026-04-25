import type {SchemaDomain} from './SchemaDomain';
import type {NeverValidator} from './validators';

export interface Definition {
	type: string;
}

export type UnknownDefinition = Definition & Record<string, unknown>;

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

	public abstract clone(): this;
	public abstract isEqual(other: Validator): other is this;
	public abstract merge(other: Validator, path?: string): Validator;
	public abstract normalize(): this | NeverValidator;
	public abstract isSubset(other: Validator): boolean;

	public abstract toJSON(): Definition;
}