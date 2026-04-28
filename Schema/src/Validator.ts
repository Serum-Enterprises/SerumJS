import type {Domain} from './Domain';

export interface Definition {
	type: string;
}

export type UnknownDefinition = Definition & Record<string, unknown>;

export interface ValidatorClass<V extends Validator = Validator> {
	fromJSON(data: UnknownDefinition, path: string, domain: Domain): V;

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

	public isSameValidator(other: Validator): other is this {
		return this.constructor === other.constructor;
	}
	public abstract isEqual(other: Validator): other is this;
	public abstract clone(): this;
	protected abstract _merge(other: Validator, path?: string): Validator;
	public merge(other: Validator, path: string = 'validator'): Validator {
		return this.normalize()._merge(other.normalize(), path).normalize();
	}
	public abstract normalize(): Validator;
	protected abstract _isSubset(other: Validator): boolean;
	public isSubset(other: Validator): boolean {
		return this.normalize()._isSubset(other.normalize());
	}

	public abstract toJSON(): Definition;
}