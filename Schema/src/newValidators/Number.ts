import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from "../lib/errors";

export interface NumberValidatorDefinition extends Definition {
	type: 'number',
	integer?: boolean
	min?: number,
	max?: number,
	equals?: number
}

export class NumberValidator<T extends number = number> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): Validator {
		const validator = new NumberValidator();

		if('integer' in definition) {
			if (!JSON.isBoolean(definition['integer']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.integer`);

			validator._integer = definition['integer'];
		}

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
			if(!JSON.isNumber(definition['equals']))
				throw new DefinitionError(`Expected a Number`, `${path}.equals`);

			validator._equals = definition['equals'];
		}

		return validator;
	}

	protected _integer: boolean = false;
	protected _min: number | null = null;
	protected _max: number | null = null;
	protected _equals: number | null = null;

	public clone(): this {
		const validator = new NumberValidator() as this;

		validator._integer = this._integer;
		validator._min = this._min;
		validator._max = this._max;
		validator._equals = this._equals;

		return validator;
	}

	public toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: 'number'
		};

		if(this._integer)
			definition.integer = this._integer;

		if(this._min !== null)
			definition.min = this._min;

		if(this._max !== null)
			definition.max = this._max;

		if(this._equals !== null)
			definition.equals = this._equals;

		return definition;
	}
}