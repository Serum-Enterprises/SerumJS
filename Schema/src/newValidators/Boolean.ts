import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from "../lib/errors";

export interface BooleanValidatorDefinition extends Definition {
	type: 'boolean',
	equals?: boolean
}

export class BooleanValidator<T extends boolean = boolean> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: SchemaDomain
	): Validator {
		const validator = new BooleanValidator();

		if('equals' in definition) {
			if(!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.equals`);

			validator._equals = definition['equals'];
		}

		return validator;
	}

	protected _equals: boolean | null = null;

	public clone(): this {
		const validator = new BooleanValidator() as this;

		validator._equals = this._equals;

		return validator;
	}

	public toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'boolean'
		};

		if(this._equals !== null)
			definition.equals = this._equals;

		return definition;
	}
}