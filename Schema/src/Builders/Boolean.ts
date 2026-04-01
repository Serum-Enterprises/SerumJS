import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {ApplyNullability} from '../lib/util';
import {BooleanValidator} from '../Validators/Boolean';

export class BooleanBuilder<
	T extends JSON.Boolean = JSON.Boolean,
	N extends boolean = false
> extends BooleanValidator<ApplyNullability<T, N>> {
	public nullable<const F extends boolean = true>(flag?: F): BooleanBuilder<T, F> {
		this._nullable = flag ?? true ? Option.Some(null) : Option.None();

		return this as unknown as BooleanBuilder<T, F>;
	}

	public equals<const V extends boolean>(value: V): BooleanBuilder<V, N> {
		this._equals = Option.Some(value);

		return this as unknown as BooleanBuilder<V, N>;
	}
}