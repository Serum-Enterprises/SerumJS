import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from "../lib/errors";

export interface StringValidatorDefinition extends Definition {
	type: 'string',
	min?: number,
	max?: number,
	equals?: string
}

export class StringValidator<T extends string = string> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): Validator {
		const validator = new StringValidator();

		if('min' in definition) {
			if(!JSON.isNumber(definition['min']))
				throw new DefinitionError(`Expected a Number`, `${path}.min`);

			validator._min = definition['min'];
		}

		if('max' in definition) {
			if(!JSON.isNumber(definition['max']))
				throw new DefinitionError(`Expected a Number`, `${path}.max`);

			validator._max = definition['max'];
		}

		if('equals' in definition) {
			if(!JSON.isString(definition['equals']))
				throw new DefinitionError(`Expected a String`, `${path}.equals`);

			validator._equals = definition['equals'];
		}

		return validator;
	}

	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _equals: string | null = null;

	public isEqual(other: Validator): other is this {
		return this.isSameSubclass(other) &&
			this._min === other._min &&
			this._max === other._max &&
			this._equals === other._equals;
	}

	public clone(): this {
		const validator = new StringValidator() as this;

		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public toJSON(): StringValidatorDefinition {
		const definition: StringValidatorDefinition = {
			type: 'string'
		};

		if(this._min !== null)
			definition.min = this._min;

		if(this._max !== null)
			definition.max = this._max;

		if(this._equals !== null)
			definition.equals = this._equals;

		return definition;
	}
}