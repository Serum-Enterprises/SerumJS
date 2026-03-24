import {Definition} from './Definitions';
import {UnionValidator} from './Validators/Union';

export abstract class Validator<T = unknown> {
	public abstract assert(data: unknown, path: string): asserts data is T;
	public isSubset(other: Validator): boolean {
		// We use a constructor name check or a dynamic import/instanceof
		// to avoid circular dependency issues between Validator and UnionValidator.
		if (other instanceof UnionValidator) {
			const variants = (other as any)._variants as Validator[];

			return variants.some(variant => this.isSubset(variant));
		}

		return this._isSubset(other);
	}

	protected abstract _isSubset(other: Validator): boolean;

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