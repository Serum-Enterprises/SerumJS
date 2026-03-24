import { Option } from '@serum-enterprises/option';
import { ApplyNullability, InferValidatorReturnType } from '../lib/util';
import { UnionValidator } from '../Validators/Union';
import { Validator } from '../Validator';

export class UnionBuilder<
	T extends readonly Validator[] = readonly Validator[],
	N extends boolean = false
> extends UnionValidator<ApplyNullability<InferValidatorReturnType<T[number]>, N>> {
	public nullable<const F extends boolean = true>(flag?: F): UnionBuilder<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as UnionBuilder<T, F>;
	}

	public variants<V extends Validator[]>(variants: V): UnionBuilder<V, N> {
		this._variants = variants;

		return this as unknown as UnionBuilder<V, N>;
	}
}