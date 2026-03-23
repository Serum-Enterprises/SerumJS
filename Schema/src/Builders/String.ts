import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {ApplyNullability} from '../lib/util';
import {StringValidator} from "../Validators/String";

export class StringBuilder<
	T extends JSON.String = JSON.String,
	N extends boolean = false
> extends StringValidator<ApplyNullability<T, N>> {
	public nullable<const F extends boolean = true>(flag?: F): StringBuilder<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as StringBuilder<T, F>;
	}

	public equals<const V extends string>(value: V): StringBuilder<V, N> {
		this._equals = Option.Some(value);

		return this as unknown as StringBuilder<V, N>;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}
}