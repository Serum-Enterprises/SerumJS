import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, BooleanValidatorDefinition} from '../Definitions';

export class BooleanValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition'
	): BooleanValidator {
		const validatorInstance = new BooleanValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if (definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if ('equals' in definition) {
			if (!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected ${path}.equals to be a Boolean`);

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _equals: Option<boolean> = Option.None();

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (JSON.isBoolean(data)) {
			if (this._equals.isSome() && this._equals.value !== data)
				throw new AssertError(`Expected ${path} to be ${this._equals.value}${this._nullable.isSome() ? '' : ' or Null'}`);
		}
		else if (JSON.isNull(data)) {
			if (!this._nullable.isSome())
				throw new AssertError(`Expected ${path} to be a Boolean${this._nullable.isSome() ? ' or Null' : ''}`);
		}
		else
			throw new AssertError(`Expected ${path} to be a Boolean${this._nullable.isSome() ? ' or Null' : ''}`);
	}

	public isSubset(other: Validator): boolean {
		if (other instanceof JSONValidator)
			return true;

		if (!(other instanceof BooleanValidator))
			return false;

		if (this._nullable.isSome() && !other._nullable.isSome())
			return false;

		if (other._equals.isSome()) {
			if (this._equals.isSome())
				return this._equals.value === other._equals.value;
			else
				return false;
		}

		return true;
	}

	public isEquals(other: Validator): boolean {
		if (!(other instanceof BooleanValidator))
			return false;

		return this._nullable.equals(other._nullable) && this._equals.equals(other._equals);
	}

	public toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'boolean'
		};

		if (this._nullable.isSome())
			definition['nullable'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}