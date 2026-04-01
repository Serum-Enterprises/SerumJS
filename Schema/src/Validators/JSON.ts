import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {AssertError} from '../lib/util';
import {Definition, JSONValidatorDefinition} from '../Definitions';

export class JSONValidator<T extends JSON.JSON = JSON.JSON> extends Validator<T> {
	public static fromJSON(
		_definition: Definition & { [key: string]: unknown },
		_path: string = 'definition'
	): JSONValidator {
		return new JSONValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is JSON.JSON {
		if (!JSON.isJSON(data))
			throw new AssertError(`Expected ${path} to be valid JSON`);
	}

	public isSubset(other: Validator): boolean {
		return other instanceof JSONValidator;
	}

	public isEquals(other: Validator): boolean {
		return other instanceof JSONValidator;
	}

	public toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}