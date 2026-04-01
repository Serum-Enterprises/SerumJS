import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {ApplyNullability} from '../lib/util';
import {NumberValidator} from '../Validators/Number';

export class NumberBuilder<
	T extends JSON.Number = JSON.Number,
	N extends boolean = false
> extends NumberValidator<ApplyNullability<T, N>> {
	public nullable<const F extends boolean = true>(flag?: F): NumberBuilder<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as NumberBuilder<T, F>;
	}

	public equals<const V extends number>(value: V): NumberBuilder<V, N> {
		this._equals = Option.Some(value);

		return this as unknown as NumberBuilder<V, N>;
	}

	public integer(flag: boolean = true): this {
		this._integer = flag ? Option.Some(null) : Option.None();

		return this;
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