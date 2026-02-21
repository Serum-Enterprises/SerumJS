import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {Definition, AssertError} from '../lib/util';

export interface JSONValidatorDefinition extends Definition {
	type: 'json';
}

export class JSONValidator<T extends JSON.JSON = JSON.JSON> extends Validator<T> {
	public static override fromJSON(
		_definition: Definition & { [key: string]: unknown },
		_path: string = 'definition'
	): Validator {
		return new JSONValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is JSON.JSON {
		if (!JSON.isJSON(data))
			throw new AssertError(`Expected ${path} to be valid JSON`);
	}

	public isSubset(other: Validator): boolean {
		return other instanceof JSONValidator;
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}