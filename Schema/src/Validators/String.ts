import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {Definition, ApplyNullability, AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {StringValidatorDefinition} from '../Definitions';

export class StringValidator<
	T extends JSON.String = JSON.String,
	N extends boolean = false
> extends Validator<ApplyNullability<T, N>> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'schema'
	): Validator {
		const validatorInstance = new StringValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			validatorInstance.nullable(definition['nullable']);
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a String`);

			validatorInstance.equals(definition['equals'], `${path}.equals`);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a positive Integer`);

			validatorInstance.min(definition['min'], `${path}.min`);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a positive Integer`);

			validatorInstance.max(definition['max'], `${path}.max`);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _equals: Option<JSON.String> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public nullable<const F extends boolean = true>(flag?: F): StringValidator<T, F> {
		this._nullable = (flag ?? true) ? Option.Some(null) : Option.None();

		return this as unknown as StringValidator<T, F>;
	}

	public equals<const V extends string>(value: V, path: string = 'equals'): StringValidator<V, N> {
		if (this._min.isSome() && this._min.value > value.length)
			throw new DefinitionError(`Expected the Equals Rules Length to be larger than or equal to the Minimum Rule at Path ${path}`);

		if (this._max.isSome() && this._max.value < value.length)
			throw new DefinitionError(`Expected the Equals Rules Length to be smaller than or equal to the Maximum Rule at Path ${path}`);


		this._equals = Option.Some(value);

		return this as unknown as StringValidator<V, N>;
	}

	public min(value: number, path: string = 'min'): this {
		if (!Number.isSafeInteger(value) || value < 0)
			throw new DefinitionError(`Expected ${path}.min to be a positive Integer`);

		if (this._max.isSome() && this._max.value < value)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to Maximum Rule at Path ${path}`);

		if (this._equals.isSome() && this._equals.value.length < value)
			throw new DefinitionError(`Expected Minimum Rule to be smaller than or equal to the Equals Rules Length at Path ${path}`);

		this._min = Option.Some(value);

		return this;
	}

	public max(value: number, path: string = 'max'): this {
		if (!Number.isSafeInteger(value) || value < 0)
			throw new DefinitionError(`Expected ${path}.max to be a positive Integer`);

		if (this._min.isSome() && this._min.value > value)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to Minimum Rule at Path ${path}`);

		if (this._equals.isSome() && this._equals.value.length > value)
			throw new DefinitionError(`Expected Maximum Rule to be larger than or equal to the Equals Rules Length at Path ${path}`);

		this._max = Option.Some(value);

		return this;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is ApplyNullability<T, N> {
		if (JSON.isString(data)) {
			if (this._equals.isSome() && this._equals.value !== data)
				throw new AssertError(`Expected ${path} to be ${this._equals.value}`);

			if (this._min.isSome() && this._min.value > data.length)
				throw new AssertError(`Expected ${path} to be at least ${this._min.value} characters long`);

			if (this._max.isSome() && this._max.value < data.length)
				throw new AssertError(`Expected ${path} to be at most ${this._max.value} characters long`);
		}
		else if(JSON.isNull(data)) {
			if(!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be a String${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be a String${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if (other instanceof JSONValidator)
			return true;

		if (!(other instanceof StringValidator))
			return false;

		if (this._nullable.isSome() && !other._nullable.isSome())
			return false;

		if (this._equals.isSome()) {
			if (other._equals.isSome() && other._equals.value !== this._equals.value)
				return false;

			if (other._min.isSome() && other._min.value > this._equals.value.length)
				return false;

			if (other._max.isSome() && other._max.value < this._equals.value.length)
				return false;

			return true;
		}

		if (other._equals.isSome())
			return false;

		if (other._min.isSome() && (!this._min.isSome() || this._min.value < other._min.value))
			return false;

		if (other._max.isSome() && (!this._max.isSome() || this._max.value > other._max.value))
			return false;

		return true;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if (this._nullable.isSome())
			definition['nullable'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		return definition;
	}
}