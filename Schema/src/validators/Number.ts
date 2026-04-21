import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
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

			if (definition['integer'])
				validatorInstance._integer = Option.Some(null);
		}

		if ('equals' in definition) {
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		return validatorInstance;
	}

	protected _integer: Option<null> = Option.None();
	protected _equals: Option<JSON.Number> = Option.None();

	public integer(flag: boolean = true): this {
		this._integer = flag ? Option.Some(null) : Option.None();

		return this;
	}

	public equals<const V extends number>(value: V): NumberValidator<V> {
		this._equals = Option.Some(value);

		return this as unknown as NumberValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isNumber(data))
			throw new AssertError(`Expected a Number`, path);

		if (this._integer.isSome() && !Number.isInteger(data))
			throw new AssertError(`Expected an Integer`, path);

		if (this._min.isSome() && this._min.value > data)
			throw new AssertError(`Expected at least ${this._min.value}`, path);

		if (this._max.isSome() && this._max.value < data)
			throw new AssertError(`Expected at most ${this._max.value}`, path);

		if (this._equals.isSome() && this._equals.value !== data)
			throw new AssertError(`Expected ${this._equals.value}`, path);
	}

	private _isNumberValidator(other: Validator): other is NumberValidator {
		return this.constructor === other.constructor;
	}

	public isEqual(other: Validator): other is this {
		if(!this._isNumberValidator(other))
			return false;

		return this._integer.equals(other._integer) &&
			this._min.equals(other._min) &&
			this._max.equals(other._max) &&
			this._equals.equals(other._equals);
	}

	public toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number',
			...BoundaryHelper.toJSON({min: this._min, max: this._max})
		};

		if (this._integer.isSome())
			definition['integer'] = true;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}