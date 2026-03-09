import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {Definition, ApplyNullability, AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';

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
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition'
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

			validatorInstance.equals(definition['equals'], `${path}.equals`);
		}

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected ${path}.integer to be a Boolean`);

			validatorInstance.integer(definition['integer'], `${path}.integer`);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance.min(definition['min'], `${path}.min`);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance.max(definition['max'], `${path}.max`);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _equals: Option<JSON.Number> = Option.None();
	protected _integer: Option<null> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public nullable<const F extends boolean = true>(flag?: F): NumberValidator<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as NumberValidator<T, F>;
	}

	public equals<const V extends number>(value: V, path: string = 'equals'): NumberValidator<V, N> {
		if (this._integer.isSome() && !Number.isSafeInteger(value))
			throw new DefinitionError(`Expected Equals Rule to be an Integer according to the Integer Rule at Path ${path}`);

		if (this._min.isSome() && this._min.value > value)
			throw new DefinitionError(`Expected Equals Rule to be larger than or equal to the Minimum Rule at Path ${path}`);

		if (this._max.isSome() && this._max.value < value)
			throw new DefinitionError(`Expected Equals Rule to be smaller than or equal to the Maximum Rule at Path ${path}`);

		this._equals = Option.Some(value);

		return this as unknown as NumberValidator<V, N>;
	}

	public integer(flag: boolean = true, path: string = 'integer'): this {
		if (flag && this._equals.isSome() && !Number.isSafeInteger(this._equals.value))
			throw new DefinitionError(`Expected Integer Rule to be a false due to the Equals Rule being a Float at Path ${path}`);

		this._integer = flag ? Option.Some(null) : Option.None();

		return this;
	}

	public min(value: number, path: string = 'min'): this {
		if (this._max.isSome() && this._max.value < value)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to Maximum Rule at Path ${path}`);

		if (this._equals.isSome() && this._equals.value < value)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to the Equals Rule at Path ${path}`);

		this._min = Option.Some(value);

		return this;
	}

	public max(value: number, path: string = 'max'): this {
		if (this._min.isSome() && this._min.value > value)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to Minimum Rule at Path ${path}`);

		if (this._equals.isSome() && this._equals.value > value)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to the Equals Rule at Path ${path}`);

		this._max = Option.Some(value);

		return this;
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
		else if(JSON.isNull(data)) {
			if(!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be a Number${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be a Number${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if (other instanceof JSONValidator)
			return true;

		if (!(other instanceof NumberValidator))
			return false;

		if (this._nullable.isSome() && !other._nullable.isSome())
			return false;

		if (this._equals.isSome()) {
			if (other._equals.isSome() && other._equals.value !== this._equals.value)
				return false;

			if (other._integer.isSome() && !Number.isInteger(this._equals.value))
				return false;

			if (other._min.isSome() && other._min.value > this._equals.value)
				return false;

			if (other._max.isSome() && other._max.value < this._equals.value)
				return false;

			return true;
		}

		if (other._equals.isSome())
			return false;

		if (!this._integer.isSome() && other._integer.isSome())
			return false;

		if (other._min.isSome() && (!this._min.isSome() || this._min.value < other._min.value))
			return false;

		if (other._max.isSome() && (!this._max.isSome() || this._max.value > other._max.value))
			return false;

		return true;
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