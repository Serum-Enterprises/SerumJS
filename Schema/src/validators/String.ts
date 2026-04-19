import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {Definition, UnknownDefinition} from '../Definitions';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface StringValidatorDefinition extends Definition {
	type: 'string';
	min?: number;
	max?: number;
	equals?: string;
}

export class StringValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): StringValidator {
		const validatorInstance = new StringValidator();

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
			if (!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			validatorInstance._equals = Option.Some(definition['equals']);
		}

		return validatorInstance;
	}

	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();
	protected _equals: Option<JSON.String> = Option.None();

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}

	public equals<const V extends string>(value: V): StringValidator<V> {
		this._equals = Option.Some(value);

		return this as unknown as StringValidator<V>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isString(data))
			throw new AssertError(`Expected a String`, path);

		if (this._min.isSome() && this._min.value > data.length)
			throw new AssertError(`Expected at least ${this._min.value} characters`, path);

		if (this._max.isSome() && this._max.value < data.length)
			throw new AssertError(`Expected at most ${this._max.value} characters`, path);

		if (this._equals.isSome() && this._equals.value !== data)
			throw new AssertError(`Expected ${this._equals.value}`, path);
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if (this._min.isSome())
			definition['min'] = this._min.value;

		if (this._max.isSome())
			definition['max'] = this._max.value;

		if (this._equals.isSome())
			definition['equals'] = this._equals.value;

		return definition;
	}
}