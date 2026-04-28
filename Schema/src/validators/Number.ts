import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from "./Never";

export interface NumberValidatorDefinition extends Definition {
	type: 'number';
	integer?: boolean;
	min?: number;
	max?: number;
	equals?: number;
}

interface NumberValidatorRules {
	integer: boolean;
	min: number | null;
	max: number | null;
	equals: number | null;
}

export class NumberValidator<T extends number = number> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NumberValidator {
		const rules: NumberValidatorRules = {
			integer: false,
			min: null,
			max: null,
			equals: null
		};

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.integer`);

			rules.integer = definition['integer'];
		}

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
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			rules.equals = definition['equals'];
		}

		return new NumberValidator(rules);
	}

	public constructor(
		public readonly rules: Readonly<NumberValidatorRules> = {integer: false, min: null, max: null, equals: null}
	) {super()}

	public integer(integer: boolean = true): NumberValidator<T> {
		return new NumberValidator({...this.rules, integer});
	}

	public min(min: number): NumberValidator<T> {
		return new NumberValidator<T>({...this.rules, min});
	}

	public max(max: number): NumberValidator<T> {
		return new NumberValidator({...this.rules, max});
	}

	public equals<const V extends number>(equals: V): NumberValidator<V> {
		return new NumberValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isNumber(data))
			throw new AssertError(`Expected a Number`, path);

		if (this.rules.integer && !Number.isInteger(data))
			throw new AssertError(`Expected an Integer`, path);

		if (this.rules.min !== null && this.rules.min > data)
			throw new AssertError(`Expected at least ${this.rules.min}`, path);

		if (this.rules.max !== null && this.rules.max < data)
			throw new AssertError(`Expected at most ${this.rules.max}`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public isSameValidator(other: Validator): other is NumberValidator {
		return this.constructor !== other.constructor
	}

	public clone(): NumberValidator<T> {
		return new NumberValidator({...this.rules});
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		return this.rules.integer === other.rules.integer &&
			this.rules.min === other.rules.min &&
			this.rules.max === other.rules.max &&
			this.rules.equals === other.rules.equals;
	}

	public merge(other: Validator, path: string = 'validator'): NumberValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const rules: NumberValidatorRules = {
			integer: false,
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

		rules.integer = this.rules.integer || other.rules.integer;

		if (this.rules.min !== null && other.rules.min !== null)
			rules.min = Math.max(this.rules.min, other.rules.min);
		else
			rules.min = this.rules.min !== null ? this.rules.min : other.rules.min;

		if (this.rules.max !== null && other.rules.max !== null)
			rules.max = Math.min(this.rules.max, other.rules.max);
		else
			rules.max = this.rules.max !== null ? this.rules.max : other.rules.max;

		return new NumberValidator({...this.rules});
	}

	protected _isValid(): boolean {
		if (this.rules.min !== null && this.rules.max !== null && this.rules.min > this.rules.max)
			return false;

		if (this.rules.equals !== null) {
			if (this.rules.min !== null && this.rules.min > this.rules.equals)
				return false;

			if (this.rules.max !== null && this.rules.max < this.rules.equals)
				return false;

			if (this.rules.integer && !JSON.isInteger(this.rules.equals))
				return false;
		}

		if (this.rules.integer && this.rules.min !== null && this.rules.max !== null && Math.ceil(this.rules.min) > Math.floor(this.rules.max))
			return false;

		return true;
	}

	public normalize(): Validator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
	}

	protected _effectiveMin(): number | null {
		if (this.rules.min === null)
			return null;

		return this.rules.integer ? Math.ceil(this.rules.min) : this.rules.min;
	}

	protected _effectiveMax(): number | null {
		if (this.rules.max === null)
			return null;

		return this.rules.integer ? Math.floor(this.rules.max) : this.rules.max;
	}

	protected override _isSubset(other: Validator): boolean {
		if (!this.isSameValidator(other))
			return false;

		if (this.rules.equals !== null) {
			if (other.rules.equals !== null)
				return this.rules.equals === other.rules.equals;

			if (other.rules.integer && !JSON.isInteger(this.rules.equals))
				return false;

			const otherMin = other._effectiveMin();
			const otherMax = other._effectiveMax();

			if (otherMin !== null && this.rules.equals < otherMin)
				return false;

			if (otherMax !== null && this.rules.equals > otherMax)
				return false;

			return true;
		}

		if (other.rules.equals !== null)
			return false;

		if (other.rules.integer && !this.rules.integer)
			return false;

		const thisMin = this._effectiveMin();
		const thisMax = this._effectiveMax();
		const otherMin = other._effectiveMin();
		const otherMax = other._effectiveMax();

		if (otherMin !== null) {
			if (thisMin === null)
				return false;

			if (thisMin < otherMin)
				return false;
		}

		if (otherMax !== null) {
			if (thisMax === null)
				return false;

			if (thisMax > otherMax)
				return false;
		}

		return true;
	}

	public override toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number'
		};

		if (this.rules.integer)
			definition['integer'] = true;

		if (this.rules.min !== null)
			definition['min'] = this.rules.min;

		if (this.rules.max !== null)
			definition['max'] = this.rules.max;

		if (this.rules.equals !== null)
			definition['equals'] = this.rules.equals;

		return definition;
	}
}