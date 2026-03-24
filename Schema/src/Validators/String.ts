import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, StringValidatorDefinition} from '../Definitions';

export class StringValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'schema'
	): StringValidator {
		const validatorInstance = new StringValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if(definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a String`);

			validatorInstance._equals = Option.Some(definition['equals']);
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
	protected _equals: Option<JSON.String> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public assert(data: unknown, path: string = 'data'): asserts data is T {
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

	protected _isSubset(other: Validator): boolean {
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