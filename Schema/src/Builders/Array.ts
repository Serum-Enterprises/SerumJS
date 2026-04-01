import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {
	ApplyNullability,
	InferDefinitionType, InferValidatorReturnType,
	InferListDefinitionType, InferListReturnType
} from '../lib/util';
import {Definition} from '../Definitions';
import {ArrayValidator} from '../Validators/Array';

type ArrayResult<E, T> =
	T extends readonly unknown[]
		? [...{ [K in keyof T]: T[K] & E }, ...E[]]
		: E[];

export class ArrayBuilder<
	// E & T are the Every and Tuple Return Types
	E = unknown,
	T = unknown,
	// EV & TV are the Every and Tuple Definitions
	ED extends Definition = Definition,
	TD extends readonly Definition[] = readonly Definition[],
	// N is the Nullable Flag
	N extends boolean = false
> extends ArrayValidator<ApplyNullability<ArrayResult<E, T>, N>, ED, TD> {
	public nullable<const F extends boolean = true>(flag?: F): ArrayBuilder<E, T, ED, TD, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ArrayBuilder<E, T, ED, TD, F>;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}

	public every<const V extends Validator>(validator: V): ArrayBuilder<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD, N> {
		this._every = Option.Some(validator);

		return this as unknown as ArrayBuilder<InferValidatorReturnType<V>, T, InferDefinitionType<V>, TD, N>;
	}

	public tuple<const V extends readonly Validator[]>(validators: V): ArrayBuilder<E, InferListReturnType<V>, ED, InferListDefinitionType<V>, N> {
		this._tuple = Option.Some(validators);

		return this as unknown as ArrayBuilder<E, InferListReturnType<V>, ED, InferListDefinitionType<V>, N>;
	}
}