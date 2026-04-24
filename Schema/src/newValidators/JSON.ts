import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';

export interface JSONValidatorDefinition extends Definition {
	type: 'json'
}

export class JSONValidator extends Validator<JSON.JSON> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): JSONValidator {
		return new JSONValidator();
	}

	public clone(): this {
		return new JSONValidator() as this;
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}