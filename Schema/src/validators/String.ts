import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from './Never';

export interface StringValidatorDefinition extends Definition {
	type: 'string';
	min?: number;
	max?: number;
	equals?: string;
}

export class StringValidator<T extends string = string> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): StringValidator {
		const validator = new StringValidator();

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			validator._min = definition['min'];
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			validator._max = definition['max'];
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			validator._equals = definition['equals'];
		}

		return validator;
	}

	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _equals: string | null = null;

	public min(value: number): this {
		this._min = value;

		return this;
	}

	public max(value: number): this {
		this._max = value;

		return this;
	}

	public equals<const V extends string>(value: V): StringValidator<V> {
		this._equals = value;

		return this as unknown as StringValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this._min !== null && this._min > data.length)
			throw new AssertError(`Expected at least ${this._min} characters`, path);

		if (this._max !== null && this._max < data.length)
			throw new AssertError(`Expected at most ${this._max} characters`, path);

		if (this._equals !== null && this._equals !== data)
			throw new AssertError(`Expected ${this._equals}`, path);
	}

	public isSameValidator(other: Validator): other is StringValidator {
		return this.constructor === other.constructor;
	}

	public clone(): this {
		const validator = new StringValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		return this._min === other._min &&
			this._max === other._max &&
			this._equals === other._equals;
	}

	protected _isValid(): boolean {
		if (this._min !== null && this._max !== null && this._min > this._max)
			return false;

		if (this._equals !== null) {
			if (this._min !== null && this._equals.length < this._min)
				return false;

			if (this._max !== null && this._equals.length > this._max)
				return false;
		}

		return true;
	}

	public normalize(): this | NeverValidator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
	}

	public merge(other: Validator, path: string = 'validator'): StringValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: { left: this, right: other }
			});

		const validator = new StringValidator();

		if (this._equals !== null && other._equals !== null && this._equals !== other._equals)
			throw new MergeError(`Conflicting equals Constraints`, `${path}.equals`, {
				cause: {
					left: this._equals,
					right: other._equals
				}
			});

		validator._equals = this._equals !== null
			? this._equals
			: other._equals;

		if (this._min !== null && other._min !== null)
			validator._min = Math.max(this._min, other._min);
		else
			validator._min = this._min !== null ? this._min : other._min;

		if (this._max !== null && other._max !== null)
			validator._max = Math.min(this._max, other._max);
		else
			validator._max = this._max !== null ? this._max : other._max;

		return validator;
	}

	protected override _isSubset(other: Validator): boolean {
		if (!this.isSameValidator(other))
			return false;

		if (this._equals !== null) {
			if (other._equals !== null)
				return this._equals === other._equals;

			if (other._min !== null && this._equals.length < other._min)
				return false;

			if (other._max !== null && this._equals.length > other._max)
				return false;

			return true;
		}

		if (other._equals !== null)
			return false;

		if (other._min !== null) {
			if (this._min === null)
				return false;

			if (this._min < other._min)
				return false;
		}

		if (other._max !== null) {
			if (this._max === null)
				return false;

			if (this._max > other._max)
				return false;
		}

		return true;
	}


	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if (this._min !== null)
			definition['min'] = this._min;

		if (this._max !== null)
			definition['max'] = this._max;

		if (this._equals !== null)
			definition['equals'] = this._equals;

		return definition;
	}
}