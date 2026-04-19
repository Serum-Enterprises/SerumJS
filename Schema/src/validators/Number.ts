import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface NumberValidatorDefinition extends Definition {
	type: 'number';
	integer?: boolean;
	min?: number;
	max?: number;
	equals?: number;
}

export class NumberValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NumberValidator {
		const validatorInstance = new NumberValidator();

		if ('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.integer`);

			if (definition['integer'])
				validatorInstance._integer = Option.Some(null);
		}

		if ('min' in definition) {
			if (!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			validatorInstance._min = Option.Some(definition['min']);
		}

		if ('max' in definition) {
			if (!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			validatorInstance._max = Option.Some(definition['max']);
		}

		if ('equals' in definition) {
			if (!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		return validatorInstance;
	}

	protected _integer: Option<null> = Option.None();
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();
	protected _equals: Option<JSON.Number> = Option.None();

	public integer(flag: boolean = true): this {
		this._integer = flag ? Option.Some(null) : Option.None();

		return this;
	}

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

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

	public toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number'
		};

		if (this._integer.isSome())
			definition['integer'] = true;

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}