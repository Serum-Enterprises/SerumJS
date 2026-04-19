import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {Definition, UnknownDefinition} from '../Definitions';
import {AssertError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface JSONValidatorDefinition extends Definition {
	type: 'json';
}

export class JSONValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): JSONValidator {
		return new JSONValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (!JSON.isJSON(data))
			throw new AssertError(`Expected valid JSON`, path);
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}