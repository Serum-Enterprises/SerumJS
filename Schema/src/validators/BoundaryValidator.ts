import {JSON} from '@serum-enterprises/json';
import {UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from '../lib/errors';

export function fromJSON(definition: UnknownDefinition, path: string = 'definition'): {
	min: number | null,
	max: number | null
} {
	const result: { min: number | null, max: number | null } = {min: null, max: null};

	if ('min' in definition) {
		if (!JSON.isNumber(definition['min']))
			throw new DefinitionError(`Expected a Number`, `${path}.min`);

		result.min = definition['min'];
	}

	if ('max' in definition) {
		if (!JSON.isNumber(definition['max']))
			throw new DefinitionError(`Expected a Number`, `${path}.max`);

		result.max = definition['max'];
	}

	return result;
}

export function toJSON(data: { min: number | null, max: number | null }): BoundaryDefinition {
	const definition: BoundaryDefinition = {};

	if (data.min !== null)
		definition['min'] = data.min;

	if (data.max !== null)
		definition['max'] = data.max;

	return definition;
}

export interface BoundaryDefinition {
	min?: number;
	max?: number;
}

export abstract class BoundaryValidator<T = unknown> extends Validator<T> {
	protected _min: number | null = null;
	protected _max: number | null = null;

	public min(value: number): this {
		this._min = value;

		return this;
	}

	public max(value: number): this {
		this._max = value;

		return this;
	}
}