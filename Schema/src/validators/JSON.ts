import {JSON} from '@serum-enterprises/json';
import {Validator, Definition, UnknownDefinition} from '../Validator';
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

	public isEqual(other: Validator): other is this {
		return this.isSameSubclass(other);
	}

	public override normalize(): this {
		return super.normalize() as this;
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