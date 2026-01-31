import * as JSON from '@serum-enterprises/json';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {Definition, AssertError} from '../../util';

export interface JSONValidatorDefinition extends Definition {
	type: 'json';
}

export class JSONValidator<T extends JSON.JSON = JSON.JSON> extends Validator<T> {
	public static override fromJSON(
		_definition: Definition & { [key: string]: unknown },
		_path: string = 'definition',
		_domain: Registry
	): Validator {
		return new JSONValidator();
	}

	public override assert(data: unknown, path: string = 'data'): asserts data is JSON.JSON {
		if(!JSON.isJSON(data))
			throw new AssertError(`Expected ${path} to be valid JSON`);
	}

	public override toJSON(): JSONValidatorDefinition {
		return {
			type: 'json'
		};
	}
}