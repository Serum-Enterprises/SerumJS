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

export class NumberValidator<T extends number = number> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NumberValidator {
		const validator = new NumberValidator();

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.integer`);

			validator._integer = definition['integer'];
		}

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
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			validator._equals = definition['equals'];
		}

		return validator;
	}

	protected _integer: boolean = false;
	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _equals: number | null = null;

	public integer(flag: boolean = true): this {
		this._integer = flag;

		return this;
	}

	public min(value: number): this {
		this._min = value;

		return this;
	}

	public max(value: number): this {
		this._max = value;

		return this;
	}

	public equals<const V extends number>(value: V): NumberValidator<V> {
		this._equals = value;

		return this as unknown as NumberValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isNumber(data))
			throw new AssertError(`Expected a Number`, path);

		if (this._integer && !Number.isInteger(data))
			throw new AssertError(`Expected an Integer`, path);

		if (this._min !== null && this._min > data)
			throw new AssertError(`Expected at least ${this._min}`, path);

		if (this._max !== null && this._max < data)
			throw new AssertError(`Expected at most ${this._max}`, path);

		if (this._equals !== null && this._equals !== data)
			throw new AssertError(`Expected ${this._equals}`, path);
	}

	public isSameValidator(other: Validator): other is NumberValidator {
		return this.constructor !== other.constructor
	}

	public clone(): this {
		const validator = new NumberValidator() as this;

		validator._integer = this._integer;
		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		return this._integer === other._integer &&
			this._min === other._min &&
			this._max === other._max &&
			this._equals === other._equals;
	}

	public merge(other: Validator, path: string = 'validator'): NumberValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {
				cause: {left: this, right: other}
			});

		const validator = new NumberValidator();

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

		validator._integer = this._integer || other._integer;

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

	protected _isValid(): boolean {
		if (this._min !== null && this._max !== null && this._min > this._max)
			return false;

		if (this._equals !== null) {
			if (this._min !== null && this._min > this._equals)
				return false;

			if (this._max !== null && this._max < this._equals)
				return false;

			if (this._integer && !JSON.isInteger(this._equals))
				return false;
		}

		if (this._integer && this._min !== null && this._max !== null && Math.ceil(this._min) > Math.floor(this._max))
			return false;

		return true;
	}

	public normalize(): this | NeverValidator {
		if (!this._isValid())
			return new NeverValidator();

		return this.clone();
	}

	protected _effectiveMin(): number | null {
		if (this._min === null)
			return null;

		return this._integer ? Math.ceil(this._min) : this._min;
	}

	protected _effectiveMax(): number | null {
		if (this._max === null)
			return null;

		return this._integer ? Math.floor(this._max) : this._max;
	}

	protected override _isSubset(other: Validator): boolean {
		if (!this.isSameValidator(other))
			return false;

		if (this._equals !== null) {
			if (other._equals !== null)
				return this._equals === other._equals;

			if (other._integer && !JSON.isInteger(this._equals))
				return false;

			const otherMin = other._effectiveMin();
			const otherMax = other._effectiveMax();

			if (otherMin !== null && this._equals < otherMin)
				return false;

			if (otherMax !== null && this._equals > otherMax)
				return false;

			return true;
		}

		if (other._equals !== null)
			return false;

		if (other._integer && !this._integer)
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

		if (this._integer)
			definition['integer'] = true;

		if (this._min !== null)
			definition['min'] = this._min;

		if (this._max !== null)
			definition['max'] = this._max;

		if (this._equals !== null)
			definition['equals'] = this._equals;

		return definition;
	}
}