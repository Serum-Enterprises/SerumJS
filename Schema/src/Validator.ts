import {Definition} from './Definitions';

export abstract class Validator<T = unknown> {
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

	public abstract isSubset(other: Validator): boolean;
	public abstract isEquals(other: Validator): boolean;

	public abstract toJSON(): Definition;
}