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

interface StringValidatorRules {
	min: number | null,
	max: number | null,
	equals: string | null
}

export class StringValidator<T extends string = string> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): StringValidator {
		const rules: StringValidatorRules = {
			min: null,
			max: null,
			equals: null
		};

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			rules.min = definition['min'];
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			rules.max = definition['max'];
		}

		if ('equals' in definition) {
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			rules.equals = definition['equals'];
		}

		return new StringValidator(rules);
	}

	public constructor(
		public readonly rules: Readonly<StringValidatorRules> = {min: null, max: null, equals: null}
	) {super()}

	public min(min: number): StringValidator<T> {
		return new StringValidator<T>({...this.rules, min});
	}

	public max(max: number): StringValidator<T> {
		return new StringValidator<T>({...this.rules, max});
	}

	public equals<const V extends string>(equals: V): StringValidator<V> {
		return new StringValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this.rules.min !== null && this.rules.min > data.length)
			throw new AssertError(`Expected at least ${this.rules.min} characters`, path);

		if (this.rules.max !== null && this.rules.max < data.length)
			throw new AssertError(`Expected at most ${this.rules.max} characters`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public isSameValidator(other: Validator): other is StringValidator {
		return this.constructor === other.constructor;
	}

	public clone(): StringValidator<T> {
		return new StringValidator({...this.rules});
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		return this.rules.min === other.rules.min &&
			this.rules.max === other.rules.max &&
			this.rules.equals === other.rules.equals;
	}

	public merge(other: Validator, path: string = 'validator'): StringValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const rules: StringValidatorRules = {
			min: null,
			max: null,
			equals: null
		};

		if (this.rules.equals !== null && other.rules.equals !== null && this.rules.equals !== other.rules.equals)
			throw new MergeError(`Conflicting equals Constraints`, `${path}.equals`, {
				cause: {
					left: this.rules.equals,
					right: other.rules.equals
				}
			});

		rules.equals = this.rules.equals !== null
			? this.rules.equals
			: other.rules.equals;

		if (this.rules.min !== null && other.rules.min !== null)
			rules.min = Math.max(this.rules.min, other.rules.min);
		else
			rules.min = this.rules.min !== null ? this.rules.min : other.rules.min;

		if (this.rules.max !== null && other.rules.max !== null)
			rules.max = Math.min(this.rules.max, other.rules.max);
		else
			rules.max = this.rules.max !== null ? this.rules.max : other.rules.max;

		return new StringValidator(rules);
	}

	protected _isValid(): boolean {
		if (this.rules.min !== null && this.rules.max !== null && this.rules.min > this.rules.max)
			return false;

		if (this.rules.equals !== null) {
			if (this.rules.min !== null && this.rules.equals.length < this.rules.min)
				return false;

			if (this.rules.max !== null && this.rules.equals.length > this.rules.max)
				return false;
		}

		return true;
	}

	public normalize(): Validator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
	}

	protected override _isSubset(other: Validator): boolean {
		if (!this.isSameValidator(other))
			return false;

		if (this.rules.equals !== null) {
			if (other.rules.equals !== null)
				return this.rules.equals === other.rules.equals;

			if (other.rules.min !== null && this.rules.equals.length < other.rules.min)
				return false;

			if (other.rules.max !== null && this.rules.equals.length > other.rules.max)
				return false;

			return true;
		}

		if (other.rules.equals !== null)
			return false;

		if (other.rules.min !== null) {
			if (this.rules.min === null)
				return false;

			if (this.rules.min < other.rules.min)
				return false;
		}

		if (other.rules.max !== null) {
			if (this.rules.max === null)
				return false;

			if (this.rules.max > other.rules.max)
				return false;
		}

		return true;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if (this.rules.min !== null)
			definition['min'] = this.rules.min;

		if (this.rules.max !== null)
			definition['max'] = this.rules.max;

		if (this.rules.equals !== null)
			definition['equals'] = this.rules.equals;

		return definition;
	}
}