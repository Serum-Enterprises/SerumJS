import {Validator, Definition, UnknownDefinition} from '../Validator';
import {AssertError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';

export interface NeverValidatorDefinition extends Definition {
	type: 'never';
}

export class NeverValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		_definition: UnknownDefinition,
		_path: string = 'definition',
		_schemaDomain: SchemaDomain
	): NeverValidator {
		return new NeverValidator();
	}

	public assert(_data: unknown, path: string = 'data'): asserts _data is T {
		throw new AssertError(`Expected never`, path);
	}

	public toJSON(): NeverValidatorDefinition {
		return {
			type: 'never'
		};
	}
}
