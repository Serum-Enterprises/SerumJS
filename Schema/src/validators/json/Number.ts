import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {Definition, ApplyNullability, AssertError, DefinitionError} from '../../util';
import {Option} from '../../util/Option';

export interface NumberValidatorDefinition extends Definition {
	type: 'number';
	nullable?: boolean;
	equals?: JSON.Number;
	integer?: boolean;
	min?: number;
	max?: number;
}

export class NumberValidator<
	T extends JSON.Number = JSON.Number,
	N extends boolean = false
> extends Validator<ApplyNullability<T, N>> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition',
		_registry: Registry
	): Validator {
		const validatorInstance = new NumberValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition['nullable']);
		}

		if ('equals' in definition) {
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a Number`);

			validatorInstance.equals(definition['equals']);
		}

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected ${path}.integer to be a Boolean`);

			validatorInstance.integer(definition['integer']);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance.min(definition['min']);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance.max(definition['max']);
		}

		return validatorInstance;
	}

	public constructor(
		protected _nullable: Option<null> = Option.None(),
		protected _equals: Option<JSON.Number> = Option.None(),
		protected _integer: Option<null> = Option.None(),
		protected _min: Option<number> = Option.None(),
		protected _max: Option<number> = Option.None()
	) {
		super();
	}

	public nullable<const F extends boolean = true>(flag?: F): NumberValidator<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as any;
	}

	public equals<const V extends number>(value: V): NumberValidator<V, N> {
		this._equals = Option.Some(value);

		return this as any;
	}

	public integer(flag: boolean = true): this {
		this._integer = flag ? Option.Some(null) : Option.None();

		return this as any;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this as any;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this as any;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is ApplyNullability<T, N> {
		if (JSON.isNumber(data)) {
			if (this._equals.isSome() && this._equals.value !== data)
				throw new AssertError(`Expected ${path} to be ${this._equals.value}`);

			if (this._integer.isSome() && !Number.isInteger(data))
				throw new AssertError(`Expected ${path} to be an Integer`);

			if (this._min.isSome() && this._min.value > data)
				throw new AssertError(`Expected ${path} to be at least ${this._min.value}`);

			if (this._max.isSome() && this._max.value < data)
				throw new AssertError(`Expected ${path} to be at most ${this._max.value}`);
		}
		else if (!(this._nullable.isSome() && JSON.isNull(data)))
			throw new AssertError(`Expected ${path} to be a Number${this._nullable.isSome() ? '' : ' or Null'}`);
	}

	public toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number'
		};

		if (this._nullable.isSome())
			definition['nullable'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		if (this._integer.isSome())
			definition['integer'] = true;

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		return definition;
	}
}