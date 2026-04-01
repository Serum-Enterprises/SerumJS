import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {
	InferDefinitionType, InferValidatorReturnType,
	InferObjectDefinitionType, InferObjectReturnType
} from '../lib/util';
import {Definition} from '../Definitions';
import {ObjectValidator} from "../Validators/Object";

type ObjectResult<T, S, E extends boolean> =
	S extends { [key: string]: unknown }
		? E extends true
			? { [K in keyof S]: S[K] & T }
			: { [K in keyof S]: S[K] & T } & { [key: string]: T }
		: { [key: string]: T };

export class ObjectBuilder<
	// T & S are the Every (Type) and Shape return types
	T = unknown,
	S = unknown,
	// TD & SD are the Every (Type) and Shape definitions
	TD extends Definition = Definition,
	SD extends { [key: string]: Definition } = { [key: string]: Definition },
	// N is nullable
	N extends boolean = false,
	// E is exact (no extra props when shape is set)
	E extends boolean = false
> extends ObjectValidator<ObjectResult<T, S, E>> {
	public nullable<const F extends boolean = true>(flag?: F): ObjectBuilder<T, S, TD, SD, F, E> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ObjectBuilder<T, S, TD, SD, F, E>;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}

	public every<V extends Validator>(validator: V): ObjectBuilder<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, N, E> {
		this._every = Option.Some(validator);

		return this as unknown as ObjectBuilder<InferValidatorReturnType<V>, S, InferDefinitionType<V>, SD, N, E>;
	}

	public shape<S extends { [key: string]: Validator }>(value: S): ObjectBuilder<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, N, E> {
		this._shape = Option.Some(value);

		return this as unknown as ObjectBuilder<T, InferObjectReturnType<S>, TD, InferObjectDefinitionType<S>, N, E>;
	}

	public exact<const F extends boolean = true>(flag?: F): ObjectBuilder<T, S, TD, SD, N, F> {
		this._exact = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as ObjectBuilder<T, S, TD, SD, N, F>;
	}
}