import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from '../lib/errors';

export function fromJSON(definition: UnknownDefinition, path: string = 'definition'): {min: Option<number>, max: Option<number>} {
	const result: {min: Option<number>, max: Option<number>} = {min: Option.None(), max: Option.None()};

	if ('min' in definition) {
		if (!JSON.isNumber(definition['min']))
			throw new DefinitionError(`Expected a Number`, `${path}.min`);

		result.min = Option.Some(definition['min']);
	}

	if ('max' in definition) {
		if (!JSON.isNumber(definition['max']))
			throw new DefinitionError(`Expected a Number`, `${path}.max`);

		result.max = Option.Some(definition['max']);
	}

	return result;
}

export function toJSON(data: {min: Option<number>, max: Option<number>}): BoundaryDefinition {
	const definition: BoundaryDefinition = {};

	if (data.min.isSome())
		definition['min'] = data.min.value;

	if (data.max.isSome())
		definition['max'] = data.max.value;

	return definition;
}

export interface BoundaryDefinition {
	min?: number;
	max?: number;
}

export abstract class BoundaryValidator<T = unknown> extends Validator<T> {
	protected _min: Option<number> = Option.None();
	protected _max: Option<number> = Option.None();

	public min(value: number): this {
		this._min = Option.Some(value);

		return this;
	}

	public max(value: number): this {
		this._max = Option.Some(value);

		return this;
	}
}