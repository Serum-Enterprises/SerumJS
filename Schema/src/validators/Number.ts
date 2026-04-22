import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {NeverValidator} from "./Never";
import {BoundaryValidator, BoundaryDefinition} from './BoundaryValidator';
import * as BoundaryHelper from './BoundaryValidator';

export interface NumberValidatorDefinition extends Definition, BoundaryDefinition {
	type: 'number';
	integer?: boolean;
	equals?: number;
}

export class NumberValidator<T = unknown> extends BoundaryValidator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NumberValidator {
		const validatorInstance = new NumberValidator();
		const {max, min} = BoundaryHelper.fromJSON(definition, path);

		validatorInstance._min = min;
		validatorInstance._max = max;

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.integer`);

			validatorInstance._integer = definition['integer'];
		}

		if ('equals' in definition) {
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			validatorInstance._equals = definition['equals'];
		}

		return validatorInstance;
	}

	protected _integer: boolean = false;
	protected _equals: number | null = null;

	public integer(flag: boolean = true): this {
		this._integer = flag;

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

	private _isNumberValidator(other: Validator): other is NumberValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if (!this._isNumberValidator(other))
			return false;

		return this._integer === other._integer &&
			this._min === other._min &&
			this._max === other._max &&
			this._equals === other._equals;
	}

	protected isValid(): boolean {
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

	public override normalize(): this | NeverValidator {
		if (!this.isValid())
			return new NeverValidator();

		return this.clone();
	}

	public clone(): this {
		const validator = new NumberValidator() as this;

		validator._integer = this._integer;
		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public override toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._integer)
			definition['integer'] = true;

		if (this._equals !== null)
			definition['equals'] = this._equals;

		return definition;
	}
}