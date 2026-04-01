import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, NumberValidatorDefinition} from '../Definitions';

export class NumberValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition'
	): NumberValidator {
		const validatorInstance = new NumberValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if (definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if ('equals' in definition) {
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a Number`);

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected ${path}.integer to be a Boolean`);

			if (definition['integer'])
				validatorInstance._integer = Option.Some(null);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected ${path}.min to be a Number`);

			validatorInstance._min = Option.Some(definition['min']);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected ${path}.max to be a Number`);

			validatorInstance._max = Option.Some(definition['max']);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _equals: Option<JSON.Number> = Option.None();
	protected _integer: Option<null> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public assert(data: unknown, path: string = 'data'): asserts data is T {
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
		else if (JSON.isNull(data)) {
			if (!this._nullable.isSome())
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