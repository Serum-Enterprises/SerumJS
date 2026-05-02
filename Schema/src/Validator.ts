import type {Domain} from './Domain';
import type {Definition, ReadonlyRule, UnknownDefinition} from './lib/types';

export interface ValidatorClass<
	V extends Validator = Validator,
	R extends Readonly<Record<string, ReadonlyRule>> = Readonly<Record<string, ReadonlyRule>>
> {
	fromJSON(data: UnknownDefinition, path: string, domain: Domain): V;

	new(rules?: R): V;
}

export abstract class Validator<
	T = unknown,
	R extends Readonly<Record<string, ReadonlyRule>> = Readonly<Record<string, ReadonlyRule>>
> {
	public constructor(
		public readonly rules: R,
	) {}

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

	public abstract toJSON(): Definition;
}